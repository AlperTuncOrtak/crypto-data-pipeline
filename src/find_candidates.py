"""
Copy trading icin aday trader cuzdani tarayicisi.

NE YAPAR: ucuz aglarda gercekten takas yapan EOA cuzdanlari bulur ve
OLCULEBILIR aktiflik metrikleriyle siralar — kac takas, kac farkli token,
toplam hacim, kac gune yayilmis.

NE YAPMAZ: "bu iyi trader" demez. Kalite iddiasi olcum ister; onu
copy_signals motoru haftalar icinde uretecek. Burada gorunen her sey
zincirden okunan sayidir.

Elle calistirilir, dongu degil:
    python src/find_candidates.py                 # tum ucuz aglar
    python src/find_candidates.py --chain base --limit 40
"""
import argparse
import logging
import os
import sys
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.alchemy_service import CHAINS, _canonical_tokens
from backend.services.copy_signals import (
    _detect_swaps,
    _drop_spam,
    _fetch_chain_transfers,
    _rpc_transfers,
)
from backend.services.price_service import get_live_prices_sync

logging.basicConfig(level=logging.WARNING, format="%(message)s")

# Kullanicinin gas'tan kacabilmesi icin sadece ucuz aglar. Ethereum
# mainnet kasitli olarak disarida: $50'lik islemde gas %6-30 tutuyor,
# hedef kitle icin kopyalanabilir degil.
CHEAP_CHAINS = {"base", "arbitrum", "optimism", "polygon"}

# Kesif yemi: her agda en likit stablecoin/major. Bu tokenlarin son
# transferlerinde gorunen adresler aday havuzunu olusturuyor.
BAIT_TOKENS = {
    "base": ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   # USDC
             "0x4200000000000000000000000000000000000006"],  # WETH
    "arbitrum": ["0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
                 "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
    "optimism": ["0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
                 "0x4200000000000000000000000000000000000006"],
    "polygon": ["0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
                "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
}

DISCOVERY_TRANSFERS = 1000   # yem token basina cekilecek transfer
SCREEN_SEED = 100            # aday basina giden transfer penceresi
SCREEN_MAX = 200             # aday basina gelen transfer penceresi

# --- Elemeler. Hepsi olculebilir, hicbiri kalite yargisi degil. -----
MIN_SWAPS = 3                # bu kadar takas yoksa trader degil
MAX_SWAPS = 150              # bu kadar cok takas = bot/MEV, kopyalanamaz
MIN_DISTINCT_TOKENS = 2      # tek tokenli cuzdan cesitlendirme sunmaz
MIN_VOLUME_USD = 5_000

HTTP_TIMEOUT = 20.0


def _url(chain: dict, api_key: str) -> str:
    return f"https://{chain['subdomain']}.g.alchemy.com/v2/{api_key}"


def discover(chain: dict, api_key: str) -> Counter:
    """Yem tokenlerin son transferlerinde gecen adresleri sikliga gore sayar."""
    seen: Counter = Counter()
    for token in BAIT_TOKENS.get(chain["key"], []):
        try:
            transfers = _rpc_transfers(_url(chain, api_key), {
                "contractAddresses": [token],
                "category": ["erc20"],
                "withMetadata": False,
                "excludeZeroValue": True,
                "order": "desc",
                "maxCount": hex(DISCOVERY_TRANSFERS),
            })
        except Exception as e:
            print(f"  ! {chain['key']} kesif hatasi: {e}")
            continue
        for t in transfers:
            for side in ("from", "to"):
                addr = (t.get(side) or "").lower()
                if addr and addr != "0x0000000000000000000000000000000000000000":
                    seen[addr] += 1
    return seen


def is_contract(address: str, chain: dict, api_key: str) -> bool:
    """
    Kontratlari eliyoruz: router, havuz, protokol cuzdani trader degil.
    Kesifte gorunen adreslerin cogu bunlar.
    """
    try:
        resp = httpx.post(_url(chain, api_key), json={
            "id": 1, "jsonrpc": "2.0", "method": "eth_getCode",
            "params": [address, "latest"],
        }, timeout=HTTP_TIMEOUT)
        return len(resp.json().get("result", "0x")) > 2
    except Exception:
        return True  # emin olamiyorsak aday sayma


def screen(address: str, chain: dict, api_key: str, canonical: set) -> dict | None:
    """Bir adayin gercek takas aktivitesini olcer."""
    raw = _fetch_chain_transfers(
        address, chain, api_key, None, seed_count=SCREEN_SEED, max_count=SCREEN_MAX
    )
    if not raw:
        return None

    kept = _drop_spam(raw, chain["chain_id"], canonical)
    if not kept:
        return None

    prices = get_live_prices_sync([(t.get("asset") or "").upper() for t in kept])
    swaps = _detect_swaps(kept, prices)
    if not swaps:
        return None

    days = {s["occurred_at"][:10] for s in swaps if s.get("occurred_at")}
    return {
        "address": address,
        "chain": chain["key"],
        "swaps": len(swaps),
        "tokens": len({s["symbol"] for s in swaps}),
        "volume": sum(s["usd_value"] for s in swaps),
        "active_days": len(days),
        "buys": sum(1 for s in swaps if s["side"] == "BUY"),
        "sells": sum(1 for s in swaps if s["side"] == "SELL"),
    }


def disqualify(row: dict) -> str | None:
    if row["swaps"] < MIN_SWAPS:
        return "az islem"
    if row["swaps"] > MAX_SWAPS:
        return "bot/MEV"
    if row["tokens"] < MIN_DISTINCT_TOKENS:
        return "tek token"
    if row["volume"] < MIN_VOLUME_USD:
        return "dusuk hacim"
    if row["sells"] == 0:
        # Hic satmayan cuzdan cikis sinyali uretmez — kopyalanacak bir sey yok.
        return "hic satmiyor"
    return None


def scan_chain(chain: dict, api_key: str, canonical: set, limit: int) -> list:
    print(f"\n[{chain['key']}] kesif...")
    seen = discover(chain, api_key)
    print(f"  {len(seen)} benzersiz adres gorundu")

    # Cok sik gorunenler router/havuz olma egiliminde; ortadan basliyoruz.
    ranked = [a for a, _ in seen.most_common()][10 : 10 + limit * 4]

    with ThreadPoolExecutor(max_workers=8) as pool:
        flags = list(pool.map(lambda a: is_contract(a, chain, api_key), ranked))
    eoas = [a for a, c in zip(ranked, flags) if not c][:limit]
    print(f"  {len(eoas)} EOA taraniyor (kontratlar elendi)...")

    rows = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        for row in pool.map(lambda a: screen(a, chain, api_key, canonical), eoas):
            if row:
                rows.append(row)

    keep, dropped = [], defaultdict(int)
    for row in rows:
        reason = disqualify(row)
        if reason:
            dropped[reason] += 1
        else:
            keep.append(row)

    if dropped:
        print("  elenenler: " + ", ".join(f"{v} {k}" for k, v in dropped.items()))
    keep.sort(key=lambda r: (r["active_days"], r["swaps"]), reverse=True)
    return keep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chain", help="tek ag (base/arbitrum/optimism/polygon)")
    ap.add_argument("--limit", type=int, default=25, help="ag basina taranacak aday")
    args = ap.parse_args()

    api_key = os.getenv("ALCHEMY_API_KEY", "")
    if not api_key:
        sys.exit("ALCHEMY_API_KEY yok")

    canonical, degraded = _canonical_tokens()
    if degraded:
        sys.exit("kanonik token listesi alinamadi — tarama anlamsiz olur")

    chains = [
        c for c in CHAINS
        if c["key"] in CHEAP_CHAINS and (not args.chain or c["key"] == args.chain)
    ]

    everything = []
    for chain in chains:
        everything += scan_chain(chain, api_key, canonical, args.limit)

    if not everything:
        print("\nAday bulunamadi. --limit degerini artirmayi dene.")
        return

    print("\n" + "=" * 78)
    print("ADAYLAR — olculebilir aktiflik. Kalite iddiasi YOK, secim senin.")
    print("=" * 78)
    print(f"{'adres':<44}{'ag':<10}{'takas':>6}{'token':>6}{'gun':>5}{'hacim':>12}")
    for r in everything:
        print(f"{r['address']:<44}{r['chain']:<10}{r['swaps']:>6}{r['tokens']:>6}"
              f"{r['active_days']:>5}{r['volume']:>12,.0f}")

    print("\n--- Begendiklerini eklemek icin (tarzi sen doldur) ---")
    for r in everything[:15]:
        print(f"INSERT INTO whale_leaders (address, label, note, style, sort_order) VALUES "
              f"('{r['address']}', '{r['address'][:8]}', "
              f"'{r['chain']}: {r['swaps']} takas / {r['active_days']} gun', "
              f"'active', 50);")


if __name__ == "__main__":
    main()
