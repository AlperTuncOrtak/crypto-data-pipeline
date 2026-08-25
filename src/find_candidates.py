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

# --- Zaman dilimli kesif ---------------------------------------------
#
# Son 1000 transferi PES PESE almak, Base gibi yogun bir agda birkac
# DAKIKALIK pencere demekti. Herhangi bir bes dakikada DEX'te kim islem
# yapiyor? Insan trader haftada birkac kez islem yapar, o pencerede olma
# ihtimali sifira yakin; bot her blokta oradadir. Yani dar pencere bot
# filtresi degil, bot miknatisiydi — taranan 129 cuzdanin hepsi ya bot ya
# bostu.
#
# Cozum: ayni veri hacmini 30 GUNE serpistirmek. Toplam satir sayisi
# benzer, zaman kapsami binlerce kat genis.
DISCOVERY_DAYS = 30
DISCOVERY_SLICES = 24        # 30 gune yayilmis ince pencere sayisi
SLICE_TRANSFERS = 250        # dilim basina, yem token basina

# Bir adres dilimlerin bu kadar cogunda gorunuyorsa bot: insan trader
# 24 dilimin 1-3'unde cikar, bot neredeyse hepsinde. Taramadan ONCE
# eledigi icin bedava — ve kafadan konulmus gidis-donus esiginden cok
# daha saglam bir olcu.
MAX_SLICE_PRESENCE = 6

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


def _rpc(chain: dict, api_key: str, method: str, params: list):
    resp = httpx.post(_url(chain, api_key), json={
        "id": 1, "jsonrpc": "2.0", "method": method, "params": params,
    }, timeout=HTTP_TIMEOUT)
    return resp.json().get("result")


def _slices(chain: dict, api_key: str) -> list:
    """
    Son DISCOVERY_DAYS gune yayilmis blok araliklari.

    Saniye/blok degeri sabit yazilmiyor: aglar arasinda 0.25s ile 12s
    arasinda degisiyor ve zamanla kayiyor. Iki blogun zaman damgasindan
    olcuyoruz — iki RPC, ve kendini kalibre ediyor.
    """
    latest_hex = _rpc(chain, api_key, "eth_blockNumber", [])
    if not latest_hex:
        return []
    latest = int(latest_hex, 16)
    probe = max(latest - 100_000, 1)

    def ts(block: int):
        blk = _rpc(chain, api_key, "eth_getBlockByNumber", [hex(block), False])
        return int(blk["timestamp"], 16) if blk and blk.get("timestamp") else None

    t_new, t_old = ts(latest), ts(probe)
    if not t_new or not t_old or t_new <= t_old:
        return []

    sec_per_block = (t_new - t_old) / (latest - probe)
    span_blocks = int(DISCOVERY_DAYS * 86400 / sec_per_block)
    step = max(span_blocks // DISCOVERY_SLICES, 1)
    print(f"  ~{sec_per_block:.2f}s/blok, {DISCOVERY_DAYS} gun = {span_blocks:,} blok")

    out = []
    for i in range(DISCOVERY_SLICES):
        hi = latest - i * step
        lo = max(hi - step // 8, 1)  # dilimin kendisi ince, aralik genis
        if lo < hi:
            out.append((lo, hi))
    return out


def _bait_transfers(chain: dict, api_key: str) -> list:
    """
    Yem tokenlerin transferleri, 30 gune yayilmis dilimlerden.
    Doner: (gonderen, alan, dilim_no) uclusu.
    """
    windows = _slices(chain, api_key)
    if not windows:
        print(f"  ! {chain['key']}: blok araligi hesaplanamadi")
        return []

    pairs = []
    for idx, (lo, hi) in enumerate(windows):
        for token in BAIT_TOKENS.get(chain["key"], []):
            try:
                transfers = _rpc_transfers(_url(chain, api_key), {
                    "contractAddresses": [token],
                    "category": ["erc20"],
                    "withMetadata": False,
                    "excludeZeroValue": True,
                    "fromBlock": hex(lo),
                    "toBlock": hex(hi),
                    "order": "desc",
                    "maxCount": hex(SLICE_TRANSFERS),
                })
            except Exception as e:
                print(f"  ! {chain['key']} dilim {idx} hatasi: {e}")
                continue
            for t in transfers:
                frm, to = (t.get("from") or "").lower(), (t.get("to") or "").lower()
                if frm and to and frm != ZERO and to != ZERO:
                    pairs.append((frm, to, idx))
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
    for frm, to, _ in pairs:
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
    slices_seen: dict = defaultdict(set)
    for frm, to, slice_idx in pairs:
        if to in dex and frm not in dex:
            partners[frm].add(to)
            slices_seen[frm].add(slice_idx)
        elif frm in dex and to not in dex:
            partners[to].add(frm)
            slices_seen[to].add(slice_idx)

    # Dilim varligina gore bot elemesi. 30 gune yayilmis 24 dilimin
    # cogunda gorunmek insan davranisi degil; taramadan once eliyoruz,
    # her elenen adres tasarruf edilmis RPC demek.
    humans = {a: hits for a, hits in partners.items()
              if len(slices_seen[a]) <= MAX_SLICE_PRESENCE}
    bots = len(partners) - len(humans)
    print(f"  {len(partners)} adres DEX ile islem yapmis, {bots} tanesi "
          f"{MAX_SLICE_PRESENCE}+ dilimde (bot) elendi")

    # Siralama: cok farkli DEX'e dokunan once. Dilim sayisi da katkida —
    # iki farkli gunde islem yapan, tek gunde yapandan daha duzenli.
    return Counter({
        addr: len(hits) * 10 + len(slices_seen[addr])
        for addr, hits in humans.items()
    })


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
    # Cuzdan bazinda topluyoruz. Ayni adres bes agda da gecerse bes satir
    # basmak, dort agli taramada ciktiyi okunmaz yapiyor — ve adres
    # tabloda zaten UNIQUE, bes INSERT'in dordu bosa gider.
    merged: dict = {}
    for r in everything:
        m = merged.setdefault(r["address"], {
            "address": r["address"], "chains": [], "swaps": 0,
            "tokens": 0, "volume": 0.0, "buys": 0, "sells": 0,
        })
        m["chains"].append(r["chain"])
        m["swaps"] += r["swaps"]
        m["tokens"] = max(m["tokens"], r["tokens"])
        m["volume"] += r["volume"]
        m["buys"] += r["buys"]
        m["sells"] += r["sells"]

    rows = sorted(merged.values(), key=lambda m: m["volume"], reverse=True)

    print(f"{'adres':<44}{'ag':>3}{'takas':>7}{'token':>6}{'al/sat':>9}{'hacim':>14}")
    for m in rows:
        print(f"{m['address']:<44}{len(m['chains']):>3}{m['swaps']:>7}{m['tokens']:>6}"
              f"{m['buys']:>5}/{m['sells']:<3}{m['volume']:>14,.0f}")
    print("\n('ag' = kac agda kriterleri gecti, 'token' = en cesitli agdaki token sayisi)")

    print("\n--- Begendiklerini eklemek icin (tarzi sen doldur) ---")
    for m in rows[:15]:
        print(f"INSERT INTO whale_leaders (address, label, note, style, sort_order) VALUES "
              f"('{m['address']}', '{m['address'][:8]}', "
              f"'{'/'.join(m['chains'])}: {m['swaps']} takas, {m['tokens']} token', "
              f"'active', 50);")


if __name__ == "__main__":
    main()
