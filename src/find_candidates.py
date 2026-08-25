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
from backend.services.copy_history import analyse
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
SCREEN_SEED = 300            # aday basina giden transfer penceresi
SCREEN_MAX = 600             # aday basina gelen transfer penceresi

# Bu kadar cok gorunen adres DEX altyapisi adayi. Normal kullanici 1-3
# kez gorunur, bir router yuzlerce. Bunlari ELEMIYORUZ — fener olarak
# kullaniyoruz, takas yapanlar onlarla temas edenlerdir.
HOT_MIN_APPEARANCES = 15
HOT_CHECK_CAP = 60
# Kontrat kontrolu ucuz (tek RPC) ama sonsuz degil.
CONTRACT_CHECK_CAP = 400

# --- Elemeler. Hepsi olculebilir, hicbiri kalite yargisi degil. -----
MIN_SWAPS = 3                # bu kadar takas yoksa trader degil
MAX_SWAPS = 150              # bu kadar cok takas = bot/MEV, kopyalanamaz
MIN_DISTINCT_TOKENS = 2      # tek tokenli cuzdan cesitlendirme sunmaz
MIN_VOLUME_USD = 2_000
# Tum gecmiste bundan fazla gidis-donus = arbitraj/MEV botu. Yuksek
# isabetle binlerce kucuk islem kopyalanabilir bir strateji degil;
# takipci her birinde gas oder, bot ise mikro farklardan kazanir.
BOT_ROUND_TRIPS = 300

HTTP_TIMEOUT = 20.0


def _url(chain: dict, api_key: str) -> str:
    return f"https://{chain['subdomain']}.g.alchemy.com/v2/{api_key}"


ZERO = "0x0000000000000000000000000000000000000000"


def _bait_transfers(chain: dict, api_key: str) -> list:
    """Yem tokenlerin son transferleri — (gonderen, alan) ciftleri."""
    pairs = []
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
            frm, to = (t.get("from") or "").lower(), (t.get("to") or "").lower()
            if frm and to and frm != ZERO and to != ZERO:
                pairs.append((frm, to))
    return pairs


def discover(chain: dict, api_key: str) -> Counter:
    """
    Takas yapan cuzdanlari, DEX altyapisiyla temas ederek bulur.

    Onceki yaklasim USDC transferlerinde gorunen HERKESI topluyordu; maas
    alani, borsadan cekeni, airdrop alani da. 50 adresin 46'si hic takas
    yapmamisti.

    Ayirt edici ozellik su: takas yapan kisi tokeni bir DEX havuzuna/
    router'ina GONDERIR. O kontratlarin adresleri zaten elimizdeydi —
    "cok sik goruluyor, demek ki altyapi" diye ATTIGIMIZ adreslerdi.
    Cope atmak yerine fener olarak kullaniyoruz: once sik gorunen
    KONTRATLARI buluyoruz (DEX altyapisi), sonra onlarla islem yapan
    EOA'lari topluyoruz. Kac farkli DEX kontratina dokundugu da siralama
    olcusu — cok DEX = gercek trader, tek DEX = tek seferlik kullanici.

    Doner: EOA -> dokundugu farkli DEX kontrati sayisi.
    """
    pairs = _bait_transfers(chain, api_key)
    if not pairs:
        return Counter()

    freq: Counter = Counter()
    for frm, to in pairs:
        freq[frm] += 1
        freq[to] += 1

    # Sik gorunen adresler altyapi ADAYI; kontrat olanlar gercekten oyle.
    hot = [a for a, n in freq.items() if n >= HOT_MIN_APPEARANCES][:HOT_CHECK_CAP]
    with ThreadPoolExecutor(max_workers=10) as pool:
        flags = list(pool.map(lambda a: is_contract(a, chain, api_key), hot))
    dex = {a for a, c in zip(hot, flags) if c}
    print(f"  {len(dex)} DEX kontrati tespit edildi (fener)")
    if not dex:
        return Counter()

    # Bu kontratlarla islem yapan adresler — takas yapanlar burada.
    partners: dict = defaultdict(set)
    for frm, to in pairs:
        if to in dex and frm not in dex:
            partners[frm].add(to)
        elif frm in dex and to not in dex:
            partners[to].add(frm)

    return Counter({addr: len(hits) for addr, hits in partners.items()})


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

    # DIKKAT: bu gun sayisi cuzdanin omru degil, ORNEKLEMIN kapsadigi
    # araliktir. Pencere adet sinirli oldugu icin cok aktif bir cuzdanda
    # tek gune sikisabilir; bu yuzden siralamada belirleyici degil.
    days = {s["occurred_at"][:10] for s in swaps if s.get("occurred_at")}
    return {
        "address": address,
        "chain": chain["key"],
        "swaps": len(swaps),
        "tokens": len({s["symbol"] for s in swaps}),
        "volume": sum(s["usd_value"] for s in swaps),
        "sample_days": len(days),
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
    partners = discover(chain, api_key)
    if not partners:
        print("  DEX temasi bulunamadi")
        return []
    # Cok farkli DEX kontratina dokunan once: tek DEX'e dokunan bir kez
    # takas yapmis olabilir, bes DEX'e dokunan duzenli trader.
    pool_addrs = [a for a, _ in partners.most_common(CONTRACT_CHECK_CAP)]
    print(f"  {len(partners)} adres DEX ile islem yapmis")

    with ThreadPoolExecutor(max_workers=10) as pool:
        flags = list(pool.map(lambda a: is_contract(a, chain, api_key), pool_addrs))
    eoas = [a for a, c in zip(pool_addrs, flags) if not c][:limit]
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
    keep.sort(key=lambda r: (r["volume"], r["swaps"]), reverse=True)
    return keep


def check_addresses(addresses: list, api_key: str, canonical: set, chains: list) -> list:
    """
    Elle bulunmus adresleri dogrular — kesif adimini atlar.

    Is akisi genelde bu: adresi Dune/Arkham'da bulmak dakikalar suruyor,
    zor olan "bu gercekten trader mi, bot mu, hic satiyor mu" sorusu.
    Kesif verimi dusuk (%4), dogrulama ise kesin.
    """
    rows = []
    for addr in addresses:
        addr = addr.strip().lower()
        if not addr:
            continue
        print(f"\n{addr}")
        found = False
        passed, blocking = [], []
        for chain in chains:
            row = screen(addr, chain, api_key, canonical)
            if not row:
                continue
            found = True
            reason = disqualify(row)
            verdict = f"ELENDI ({reason})" if reason else "GECTI"
            print(f"  {chain['key']:<10} {row['swaps']:>3} takas  {row['tokens']} token  "
                  f"al/sat {row['buys']}/{row['sells']}  ${row['volume']:>12,.0f}  {verdict}")
            if reason:
                # Bot olmak cuzdanin ozelligi, agin degil. Bir agda bot
                # gorunen cuzdan diger agda "temiz" cikinca aday sayilamaz.
                if reason == "bot/MEV":
                    blocking.append(f"{chain['key']}: {reason}")
            else:
                passed.append(row)
        if not found:
            print("  hicbir agda takas bulunamadi")
            continue

        # Gerceklesmis kar: sadece iki bacagini da gordugumuz gidis-donusler.
        pnl = analyse(addr, chains, api_key, canonical)
        if pnl["round_trips"]:
            pct = pnl["pnl_pct"]
            print(f"  KAR: {pnl['round_trips']} tam islem, "
                  f"{pnl['wins']} karli (%{pnl['win_rate'] * 100:.0f}), "
                  f"${pnl['pnl_usd']:,.0f} "
                  f"({pct * 100:+.1f}% yatirilan sermayeye gore)")
        else:
            print("  KAR: olculemedi — tam gidis-donus yok")
        if pnl["unmatched_sells"]:
            print(f"       ({pnl['unmatched_sells']} satisin alisini gormedik — "
                  "borsadan/kopruden gelmis, hesaba katilmadi)")

        # Gidis-donus sayisi, pencereye bagli takas sayisindan cok daha iyi
        # bir bot gostergesi: tum gecmisi kapsiyor. Yuksek isabetle binlerce
        # kucuk islem arbitraj botunun imzasi, kopyalanabilir bir strateji degil.
        if pnl["round_trips"] > BOT_ROUND_TRIPS:
            blocking.append(f"gecmiste {pnl['round_trips']} gidis-donus")

        if blocking:
            print(f"  >>> ADAY DEGIL: {', '.join(blocking)}")
        elif passed:
            rows.extend(passed)
            print("  >>> ADAY")
        else:
            print("  >>> ADAY DEGIL: hicbir agda kriterleri gecmedi")
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chain", help="tek ag (base/arbitrum/optimism/polygon)")
    ap.add_argument("--limit", type=int, default=25, help="ag basina taranacak aday")
    ap.add_argument("--check", help="virgulle ayrilmis adresler — kesfi atla, sadece dogrula")
    args = ap.parse_args()

    api_key = os.getenv("ALCHEMY_API_KEY", "")
    if not api_key:
        sys.exit("ALCHEMY_API_KEY yok")

    canonical, degraded = _canonical_tokens()
    if degraded:
        sys.exit("kanonik token listesi alinamadi — tarama anlamsiz olur")

    # Kesif sadece ucuz aglarda: urun kullaniciyi oraya yonlendiriyor.
    # DOGRULAMA ise tum aglara bakmali — bir cuzdanin mainnet'te islem
    # yaptigini gormezsek "trader degil" diye yanlis eleriz. Nerede islem
    # yaptigi ciktida zaten yaziyor, karari ona gore verirsin.
    scope = CHAINS if args.check else [c for c in CHAINS if c["key"] in CHEAP_CHAINS]
    chains = [c for c in scope if not args.chain or c["key"] == args.chain]

    if args.check:
        everything = check_addresses(args.check.split(","), api_key, canonical, chains)
    else:
        everything = []
        for chain in chains:
            everything += scan_chain(chain, api_key, canonical, args.limit)

    if not everything:
        print("\nKriterleri gecen adres yok.")
        return

    print("\n" + "=" * 78)
    print("ADAYLAR — olculebilir aktiflik. Kalite iddiasi YOK, secim senin.")
    print("=" * 78)
    print(f"{'adres':<44}{'ag':<10}{'takas':>6}{'token':>6}{'al/sat':>8}{'hacim':>12}")
    for r in everything:
        print(f"{r['address']:<44}{r['chain']:<10}{r['swaps']:>6}{r['tokens']:>6}"
              f"{r['buys']:>4}/{r['sells']:<3}{r['volume']:>12,.0f}")

    print("\n--- Begendiklerini eklemek icin (tarzi sen doldur) ---")
    for r in everything[:15]:
        print(f"INSERT INTO whale_leaders (address, label, note, style, sort_order) VALUES "
              f"('{r['address']}', '{r['address'][:8]}', "
              f"'{r['chain']}: {r['swaps']} takas, {r['tokens']} token', "
              f"'active', 50);")


if __name__ == "__main__":
    main()
