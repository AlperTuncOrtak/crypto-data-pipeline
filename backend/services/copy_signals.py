"""
Copy Trading Faz 2 — sinyal motoru.

Balinanin zincirdeki takaslarini tespit eder, filtreden gecirir, kaydeder.
GERCEK ISLEM YAPMAZ. Amaci "hangi balina gercekten para kazandiriyor"
sorusunu olcerek cevaplamak; Faz 3 o veriyle secilir.

Neden webhook degil polling: bu fazda gecikmenin onemi yok, veri birikmesi
onemli. Polling; webhook kaydi, HMAC dogrulamasi ve disa acik POST yuzeyi
olmadan ayni isi goruyor. Faz 3'te gecikme onem kazanirsa sadece tetikleyici
degisir — asagidaki tespit/filtre/kayit kodu aynen kalir.
"""
import json
import logging
import os
from datetime import datetime, timezone

import httpx
from pymysql.cursors import DictCursor

from shared.db import get_connection
from backend.services.alchemy_service import CHAINS, _canonical_tokens
from backend.services.price_service import get_live_prices_sync

logger = logging.getLogger(__name__)

# Takasin "para" tarafi. Bir tarafta bunlardan biri varsa digeri islemin
# konusu demektir: quote cikip token giriyorsa ALIM, tersi SATIM.
QUOTE_ASSETS = {"ETH", "WETH", "USDC", "USDT", "DAI", "USDS"}

# --- Filtre katmani esikleri ---------------------------------------
# Balinanin bozuk para hareketi sinyal degil. Ayrica kucuk islemleri
# kopyalamak kullaniciya gas'tan baska bir sey kazandirmaz.
MIN_SIGNAL_USD = 1_000
# Gunde bundan fazla sinyal ureten balina "trader" degil bot; kopyalayan
# kullanici sadece gas yakar.
MAX_SIGNALS_PER_DAY = 12

# Tarama basina zincir basina cekilecek transfer ustu.
#
# Neden bu kadar yuksek: maxCount sunucu tarafinda uygulaniyor, yani
# spam'i sonradan elemek pencereyi genisletmiyor. Vitalik'in cuzdaninda
# 25'lik pencerenin HER IKI YONU de spam'di — sahte token'lar giden
# transfer de taklit ediyor ('Vitalik', '<3', '$ ETH77Go.com') — ve gercek
# takas hic aralaga girmiyordu. Cursor ilerledikten sonra bu tavan zaten
# devreye girmiyor, sadece yeni bloklar donuyor.
MAX_TRANSFERS = 1000
# Ilk taramada gecmise ne kadar bakilacagi — cursor yokken.
SEED_TRANSFERS = 500

RPC_TIMEOUT = 20.0


def _rpc_transfers(url: str, params: dict) -> list:
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "alchemy_getAssetTransfers",
        "params": [params],
    }
    resp = httpx.post(url, json=payload, timeout=RPC_TIMEOUT)
    resp.raise_for_status()
    body = resp.json()
    if "error" in body:
        raise RuntimeError(body["error"].get("message", "alchemy error"))
    return (body.get("result") or {}).get("transfers", [])


# "internal" her agda desteklenmiyor; desteklemeyende istek hata donuyor.
# Hangi zincirde reddedildigini hatirlayip bir daha istemiyoruz.
_NO_INTERNAL: set = set()


def _categories(chain_key: str) -> list:
    """
    Takas sonucu gelen native ETH "internal" transfer olarak gorunur —
    istenmezse WETH cozulup ETH alan her takasin gelen bacagi gorunmez olur.
    """
    if chain_key in _NO_INTERNAL:
        return ["external", "erc20"]
    return ["external", "internal", "erc20"]


def _transfers_or_retry(url: str, chain_key: str, params: dict) -> list:
    try:
        return _rpc_transfers(url, {**params, "category": _categories(chain_key)})
    except Exception as e:
        if "categor" not in str(e).lower():
            raise
        # Tekrar denemeyi _NO_INTERNAL uyeligine baglamak paralel
        # calisirken kiriliyordu: ilk thread bayragi koyar, ikinci thread
        # ayni hatayi alip "zaten biliniyor" diye yeniden denemeden
        # firlatirdi. Tarayici cok thread'li oldugu icin Arbitrum verisi
        # eksik geliyordu. Yedek liste artik acikca yaziliyor, dongu de
        # olusamaz.
        if chain_key not in _NO_INTERNAL:
            logger.info("%s: internal kategorisi desteklenmiyor, onsuz devam", chain_key)
            _NO_INTERNAL.add(chain_key)
        return _rpc_transfers(url, {**params, "category": ["external", "erc20"]})


def _fetch_chain_transfers(
    address: str,
    chain: dict,
    api_key: str,
    from_block: int | None,
    seed_count: int = SEED_TRANSFERS,
    max_count: int = MAX_TRANSFERS,
) -> list:
    """
    Cuzdanin bir zincirdeki giden+gelen transferleri.

    Iki yonu ayri ayri "son N kayit" diye cekmek yanlisti: gelen tarafi
    spam'le dolu bir cuzdanda 500 gelen kayit son birkac gunu kapsarken
    500 giden kayit aylara yayiliyor, dolayisiyla bir takasin iki bacagi
    hicbir zaman ayni pencereye dusmuyordu. Cozum: iki yon de AYNI blok
    araligindan okunuyor. Ilk taramada araligi giden transferler belirler
    (spam'in az oldugu, anlamli taraf).
    """
    url = f"https://{chain['subdomain']}.g.alchemy.com/v2/{api_key}"
    base = {"withMetadata": True, "excludeZeroValue": True}
    tagged = []

    try:
        if from_block is None:
            outs = _transfers_or_retry(url, chain["key"], {
                **base, "fromAddress": address,
                "order": "desc", "maxCount": hex(seed_count),
            })
            if not outs:
                return []
            start = min(int(t.get("blockNum", "0x0"), 16) for t in outs)
            ins = _transfers_or_retry(url, chain["key"], {
                **base, "toAddress": address, "fromBlock": hex(start),
                "order": "desc", "maxCount": hex(max_count),
            })
        else:
            window = {
                **base, "fromBlock": hex(from_block + 1),
                "order": "asc", "maxCount": hex(max_count),
            }
            outs = _transfers_or_retry(url, chain["key"], {**window, "fromAddress": address})
            ins = _transfers_or_retry(url, chain["key"], {**window, "toAddress": address})
    except Exception as e:
        logger.warning("transfer fetch failed %s: %s", chain["key"], e)
        return []

    for direction, rows in (("out", outs), ("in", ins)):
        for t in rows:
            t["_direction"] = direction
            tagged.append(t)
    return tagged


def _leg_usd(leg: dict, prices: dict) -> float:
    return float(leg.get("value") or 0) * prices.get((leg.get("asset") or "").upper(), 0)


def _classify(out_leg: dict, in_leg: dict, prices: dict) -> tuple | None:
    """
    Bir takasin yonunu belirler. Doner: (side, token_leg, usd_value)
    ya da yonu olmayan hareketler icin None.
    """
    out_sym = (out_leg.get("asset") or "").upper()
    in_sym = (in_leg.get("asset") or "").upper()
    out_usd = _leg_usd(out_leg, prices)
    in_usd = _leg_usd(in_leg, prices)

    out_is_quote = out_sym in QUOTE_ASSETS
    in_is_quote = in_sym in QUOTE_ASSETS

    if out_is_quote and in_is_quote:
        # ETH -> USDC gibi: yon bildirmiyor, sinyal degil.
        return None
    if out_is_quote:
        # Para cikti, token girdi: ALIM. Buyukluk odenen tutar.
        return "BUY", in_leg, out_usd
    if in_is_quote:
        # Token cikti, para girdi: SATIM. Buyukluk alinan tutar.
        return "SELL", out_leg, in_usd
    # Alt -> alt takasi: giren tokeni alim sayiyoruz.
    return "BUY", in_leg, max(out_usd, in_usd)


def _contract_of(leg: dict) -> str:
    raw = (leg.get("rawContract") or {}).get("address")
    return (raw or "native").lower()


def _drop_spam(transfers: list, chain_id: int, canonical: set) -> list:
    """
    Kanonik olmayan kontratlari eslestirmeden ONCE atar.
    Spam token'lar hem gelen hem giden transferi taklit ediyor; bunlar
    listede kalirsa gercek takasin bacaklari yanlis eslesiyor ve "en buyuk
    bacak" secimi sahte bir 10^9 birimlik transferi seciyordu.
    """
    return [
        t for t in transfers
        if _contract_of(t) == "native"
        or (chain_id, _contract_of(t)) in canonical
    ]


def _detect_swaps(transfers: list, prices: dict) -> list:
    """
    Ayni tx icinde hem giden hem gelen varlik varsa bu bir takastir.
    Duz gonderim/alim (tek yonlu) sinyal degildir.
    """
    by_tx: dict = {}
    for t in transfers:
        by_tx.setdefault(t.get("hash"), []).append(t)

    swaps = []
    for tx_hash, legs in by_tx.items():
        if not tx_hash:
            continue
        outs = [l for l in legs if l["_direction"] == "out"]
        ins = [l for l in legs if l["_direction"] == "in"]
        if not outs or not ins:
            continue

        # Her iki tarafta da USD olarak en buyuk bacagi aliyoruz: bir takasta
        # yonlendirme/iade bacaklari da olabiliyor, asil takas en buyugu.
        out_leg = max(outs, key=lambda l: _leg_usd(l, prices))
        in_leg = max(ins, key=lambda l: _leg_usd(l, prices))
        if (out_leg.get("asset") or "").upper() == (in_leg.get("asset") or "").upper():
            continue  # ayni varlik girip cikmis, takas degil

        verdict = _classify(out_leg, in_leg, prices)
        if not verdict:
            continue
        side, token_leg, usd_value = verdict

        meta = token_leg.get("metadata") or {}
        swaps.append({
            "tx_hash": tx_hash,
            "block_num": int(token_leg.get("blockNum", "0x0"), 16),
            "side": side,
            "symbol": (token_leg.get("asset") or "").upper()[:20],
            "contract_address": _contract_of(token_leg)[:42],
            "amount": float(token_leg.get("value") or 0),
            "usd_value": round(usd_value, 2),
            "occurred_at": meta.get("blockTimestamp"),
        })
    return swaps


def _filter(swap: dict, chain_id: int, canonical: set, accepted_today: int) -> tuple:
    """(status, reject_reason). Elenenler de kaydediliyor."""
    if not swap["symbol"]:
        return "rejected", "no_symbol"
    contract = swap["contract_address"]
    if contract != "native" and (chain_id, contract) not in canonical:
        # Ticker'ini calan sahte token. Kullaniciyi cikamayacagi bir
        # pozisyona sokmanin en hizli yolu bu olurdu.
        return "rejected", "not_canonical"
    if swap["usd_value"] < MIN_SIGNAL_USD:
        return "rejected", "too_small"
    if accepted_today >= MAX_SIGNALS_PER_DAY:
        return "rejected", "daily_cap"
    return "accepted", None


def _parse_ts(value: str | None):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(
            timezone.utc
        ).replace(tzinfo=None)
    except ValueError:
        return None


def scan_leader(conn, leader: dict, api_key: str, canonical: set) -> dict:
    """Bir liderin tum zincirlerini tarar, sinyalleri yazar, imleci ilerletir."""
    cursor = conn.cursor(DictCursor)
    blocks = leader.get("last_scanned_blocks")
    if isinstance(blocks, str):
        blocks = json.loads(blocks)
    blocks = blocks or {}

    cursor.execute(
        """SELECT COUNT(*) AS c FROM copy_signals
           WHERE leader_id = %s AND status = 'accepted'
             AND occurred_at > NOW() - INTERVAL 1 DAY""",
        (leader["id"],),
    )
    accepted_today = cursor.fetchone()["c"]

    written = {"accepted": 0, "rejected": 0}

    for chain in CHAINS:
        from_block = blocks.get(chain["key"])
        raw = _fetch_chain_transfers(leader["address"], chain, api_key, from_block)
        if not raw:
            continue

        # Imlec HAM veriden hesaplaniyor: spam de olsa o bloklar tarandi,
        # yoksa her turda ayni spam bloklari tekrar cekilir.
        max_block = max(int(t.get("blockNum", "0x0"), 16) for t in raw)

        transfers = _drop_spam(raw, chain["chain_id"], canonical)
        symbols = {(t.get("asset") or "").upper() for t in transfers}
        prices = get_live_prices_sync([s for s in symbols if s])

        swaps = _detect_swaps(transfers, prices)
        # Eski islem once islensin ki gunluk kota kronolojik uygulansin.
        swaps.sort(key=lambda s: s["block_num"])

        for swap in swaps:
            status, reason = _filter(
                swap, chain["chain_id"], canonical, accepted_today
            )
            entry_price = prices.get(swap["symbol"])
            cursor.execute(
                """INSERT IGNORE INTO copy_signals
                   (leader_id, chain, tx_hash, block_num, side, symbol,
                    contract_address, amount, usd_value, entry_price,
                    status, reject_reason, occurred_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    leader["id"], chain["key"], swap["tx_hash"], swap["block_num"],
                    swap["side"], swap["symbol"], swap["contract_address"],
                    swap["amount"], swap["usd_value"], entry_price,
                    status, reason, _parse_ts(swap["occurred_at"]),
                ),
            )
            if cursor.rowcount:
                written[status] += 1
                if status == "accepted":
                    accepted_today += 1

        blocks[chain["key"]] = max_block

    cursor.execute(
        "UPDATE whale_leaders SET last_scanned_blocks = %s WHERE id = %s",
        (json.dumps(blocks), leader["id"]),
    )
    return written


def scan_all() -> dict:
    api_key = os.getenv("ALCHEMY_API_KEY", "")
    if not api_key:
        logger.error("ALCHEMY_API_KEY yok — sinyal taramasi atlandi")
        return {"leaders": 0, "accepted": 0, "rejected": 0}

    canonical, degraded = _canonical_tokens()
    if degraded:
        # Kanonik liste yoksa her token "sahte" sayilir ve tum sinyaller
        # elenirdi. Yanlis veri yazmaktansa turu atliyoruz.
        logger.error("kanonik token listesi alinamadi — tarama atlandi")
        return {"leaders": 0, "accepted": 0, "rejected": 0}

    conn = get_connection()
    totals = {"leaders": 0, "accepted": 0, "rejected": 0}
    try:
        cursor = conn.cursor(DictCursor)
        cursor.execute(
            "SELECT id, address, last_scanned_blocks FROM whale_leaders WHERE is_active = 1"
        )
        leaders = cursor.fetchall()

        for leader in leaders:
            try:
                written = scan_leader(conn, leader, api_key, canonical)
                totals["leaders"] += 1
                totals["accepted"] += written["accepted"]
                totals["rejected"] += written["rejected"]
            except Exception as e:
                # Bir lider patlarsa digerleri taranmaya devam etsin.
                logger.warning("scan failed for %s: %s", leader["address"], e)
        return totals
    finally:
        conn.close()


if __name__ == "__main__":
    # ponytail: aglara cikmadan calisan tek kontrol — takas tespiti ve
    # filtre esikleri. Alchemy/DB entegrasyonu worker'da dogrulaniyor.
    P = {"ETH": 3000.0, "USDC": 1.0, "PEPE": 0.00001, "SCAM": 5.0}

    def leg(direction, asset, value, contract="native", block="0x10", tx="0xaa"):
        return {
            "_direction": direction, "asset": asset, "value": value, "hash": tx,
            "blockNum": block, "rawContract": {"address": None if contract == "native" else contract},
            "metadata": {"blockTimestamp": "2026-08-24T12:00:00.000Z"},
        }

    # ETH cikti, PEPE girdi -> 3 ETH karsiligi ALIM
    swaps = _detect_swaps(
        [leg("out", "ETH", 3.0), leg("in", "PEPE", 1e9, "0xpepe")], P
    )
    assert len(swaps) == 1, swaps
    assert swaps[0]["side"] == "BUY" and swaps[0]["symbol"] == "PEPE"
    assert swaps[0]["usd_value"] == 9000.0, swaps[0]

    # PEPE cikti, ETH girdi -> SATIM, buyukluk alinan ETH
    swaps = _detect_swaps(
        [leg("out", "PEPE", 1e9, "0xpepe"), leg("in", "ETH", 2.0)], P
    )
    assert swaps[0]["side"] == "SELL" and swaps[0]["symbol"] == "PEPE"
    assert swaps[0]["usd_value"] == 6000.0

    # Tek yonlu hareket takas degil
    assert _detect_swaps([leg("in", "ETH", 5.0)], P) == []
    # Iki tarafi da para olan takas yon bildirmez
    assert _detect_swaps([leg("out", "ETH", 1.0), leg("in", "USDC", 3000.0, "0xusdc")], P) == []

    # Filtre
    canon = {(1, "0xpepe")}
    big = {"symbol": "PEPE", "contract_address": "0xpepe", "usd_value": 9000.0}
    assert _filter(big, 1, canon, 0) == ("accepted", None)
    assert _filter(big, 1, set(), 0) == ("rejected", "not_canonical")
    assert _filter({**big, "usd_value": 50.0}, 1, canon, 0) == ("rejected", "too_small")
    assert _filter(big, 1, canon, MAX_SIGNALS_PER_DAY) == ("rejected", "daily_cap")
    # Native coin kanonik listede aranmaz
    assert _filter({"symbol": "ETH", "contract_address": "native", "usd_value": 9000.0},
                   1, set(), 0) == ("accepted", None)

    assert _parse_ts("2026-08-24T12:00:00.000Z").hour == 12
    assert _parse_ts(None) is None

    # Spam eleme: sahte token eslestirmeden once dusmeli, yoksa "en buyuk
    # bacak" secimi 10^9 birimlik sahte transferi seciyor.
    real = leg("out", "ETH", 3.0)
    spam = leg("out", "SCAM", 1e9, "0xspam")
    kept = _drop_spam([real, spam, leg("in", "PEPE", 1e9, "0xpepe")], 1, {(1, "0xpepe")})
    assert len(kept) == 2, kept
    assert all((t.get("asset") or "") != "SCAM" for t in kept)
    # Spam bacagi kalirsa yon yanlis cikardi; elendiginde dogru ALIM uretiliyor.
    swaps = _detect_swaps(kept, P)
    assert swaps[0]["side"] == "BUY" and swaps[0]["symbol"] == "PEPE"

    print("copy_signals self-check OK")
