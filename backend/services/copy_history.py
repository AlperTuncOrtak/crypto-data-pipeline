"""
Copy Trading Faz 2c — gerceklesmis kar/zarar.

SADECE iki bacagini da gordugumuz gidis-donusleri olcer: balina DEX'ten
aldi, sonra DEX'ten satti. Alis maliyeti de satis geliri de zincirden
okundugu icin bu rakam TAHMIN DEGIL.

Neyi olcmedigini bilerek olcmuyor:
  - Borsadan cekip sattigi token. Binance'te kaca aldigi zincirde YOK.
    Nansen/Arkham bunu cekim anindaki piyasa fiyatiyla TAHMIN ediyor;
    biz tahmini gercek gibi sunmuyoruz, o pozisyonu disarida birakiyoruz.
  - Kopruden gelen token (maliyet diger zincirde), LP pozisyonlari,
    kendi diger cuzdanindan gelenler.

Bu eksiklik bir kusur degil, bilincli sinir: urun zaten sadece DEX
takaslarini kopyalayabiliyor. Balinanin borsadaki karini olcmek, kopyalanamayan
bir faaliyeti olcmek olurdu.
"""
import logging
from collections import defaultdict, deque

import httpx

from backend.services.copy_signals import (
    _categories,
    _detect_swaps,
    _drop_spam,
    RPC_TIMEOUT,
)
from backend.services.price_service import get_live_prices_sync

logger = logging.getLogger(__name__)

PAGE_SIZE = 1000
# Cuzdan basina zincir basina sayfa ustu. 10 sayfa = 10k transfer, normal
# bir cuzdanin tum gecmisini fazlasiyla kapsiyor; bot cuzdanlarda taramanin
# sonsuza gitmesini engelliyor.
MAX_PAGES = 10

# Kayan nokta artiklari lot kuyrugunda sonsuz kucuk kalintilar birakiyor.
DUST = 1e-12


def _fetch_all(address: str, chain: dict, api_key: str, max_pages: int = MAX_PAGES) -> list:
    """Cuzdanin bir zincirdeki TUM gecmisi, sayfalama ile."""
    url = f"https://{chain['subdomain']}.g.alchemy.com/v2/{api_key}"
    out = []

    for direction, key in (("out", "fromAddress"), ("in", "toAddress")):
        page_key = None
        for _ in range(max_pages):
            params = {
                key: address,
                "category": _categories(chain["key"]),
                "withMetadata": True,
                "excludeZeroValue": True,
                "order": "asc",
                "maxCount": hex(PAGE_SIZE),
            }
            if page_key:
                params["pageKey"] = page_key
            try:
                resp = httpx.post(url, json={
                    "id": 1, "jsonrpc": "2.0",
                    "method": "alchemy_getAssetTransfers", "params": [params],
                }, timeout=RPC_TIMEOUT)
                resp.raise_for_status()
                result = (resp.json().get("result") or {})
            except Exception as e:
                logger.warning("history fetch %s/%s: %s", chain["key"], direction, e)
                break

            for t in result.get("transfers", []):
                t["_direction"] = direction
                out.append(t)

            page_key = result.get("pageKey")
            if not page_key:
                break
    return out


def realized_pnl(swaps: list) -> dict:
    """
    FIFO eslestirmesiyle gerceklesmis kar/zarar.

    Alis gormedigimiz satislar `unmatched_sells` olarak sayiliyor ve
    hesaba KATILMIYOR — maliyetini bilmedigimiz bir satistan kar
    cikarmak uydurma olurdu.
    """
    lots = defaultdict(deque)
    trips = wins = unmatched = 0
    total_cost = total_proceeds = 0.0

    for s in sorted(swaps, key=lambda x: x.get("occurred_at") or ""):
        if not s.get("amount") or s["amount"] <= 0:
            continue
        key = (s["chain"], s["contract_address"])
        unit = s["usd_value"] / s["amount"]

        if s["side"] == "BUY":
            lots[key].append([s["amount"], unit])
            continue

        remaining = s["amount"]
        matched_cost = matched_amount = 0.0
        while remaining > DUST and lots[key]:
            lot = lots[key][0]
            take = min(lot[0], remaining)
            matched_cost += take * lot[1]
            matched_amount += take
            lot[0] -= take
            remaining -= take
            if lot[0] <= DUST:
                lots[key].popleft()

        if matched_amount > 0:
            proceeds = matched_amount * unit
            trips += 1
            total_cost += matched_cost
            total_proceeds += proceeds
            if proceeds > matched_cost:
                wins += 1
        if remaining > DUST:
            # Alisini hic gormedigimiz token — borsadan/kopruden gelmis.
            unmatched += 1

    pnl = total_proceeds - total_cost
    open_positions = sum(1 for q in lots.values() if q)
    return {
        "round_trips": trips,
        "wins": wins,
        "win_rate": round(wins / trips, 3) if trips else None,
        "cost_usd": round(total_cost, 2),
        "proceeds_usd": round(total_proceeds, 2),
        "pnl_usd": round(pnl, 2),
        "pnl_pct": round(pnl / total_cost, 4) if total_cost > 0 else None,
        # Kapsama gostergeleri — rakamin ne kadarini gormedigimizi soyler.
        "unmatched_sells": unmatched,
        "open_positions": open_positions,
    }


def wallet_swaps(address: str, chains: list, api_key: str, canonical: set) -> list:
    """Cuzdanin tum zincirlerdeki gecmis takaslari."""
    swaps = []
    for chain in chains:
        raw = _fetch_all(address, chain, api_key)
        if not raw:
            continue
        kept = _drop_spam(raw, chain["chain_id"], canonical)
        if not kept:
            continue
        prices = get_live_prices_sync([(t.get("asset") or "").upper() for t in kept])
        for s in _detect_swaps(kept, prices):
            s["chain"] = chain["key"]
            swaps.append(s)
    return swaps


def analyse(address: str, chains: list, api_key: str, canonical: set) -> dict:
    return realized_pnl(wallet_swaps(address, chains, api_key, canonical))


if __name__ == "__main__":
    # ponytail: FIFO eslestirici para hesabi yapiyor, testi sart.
    def swap(side, symbol, amount, usd, when):
        return {"side": side, "chain": "base", "contract_address": f"0x{symbol}",
                "symbol": symbol, "amount": amount, "usd_value": usd,
                "occurred_at": when}

    # 100 adet $1'dan alindi, $1.5'tan satildi -> $50 kar, %50
    r = realized_pnl([
        swap("BUY", "AAA", 100, 100, "2026-01-01"),
        swap("SELL", "AAA", 100, 150, "2026-02-01"),
    ])
    assert r["round_trips"] == 1 and r["wins"] == 1, r
    assert r["pnl_usd"] == 50.0 and r["pnl_pct"] == 0.5, r
    assert r["unmatched_sells"] == 0 and r["open_positions"] == 0

    # FIFO: once ucuz lot tuketilmeli
    r = realized_pnl([
        swap("BUY", "BBB", 100, 100, "2026-01-01"),   # birim 1.0
        swap("BUY", "BBB", 100, 300, "2026-01-02"),   # birim 3.0
        swap("SELL", "BBB", 100, 200, "2026-01-03"),  # birim 2.0
    ])
    assert r["cost_usd"] == 100.0, r          # 3.0'lik lot degil, 1.0'lik
    assert r["pnl_usd"] == 100.0, r
    assert r["open_positions"] == 1, r        # pahali lot hala acik

    # Alisini gormedigimiz satis hesaba KATILMAMALI
    r = realized_pnl([swap("SELL", "CCC", 50, 500, "2026-01-01")])
    assert r["round_trips"] == 0 and r["unmatched_sells"] == 1, r
    assert r["pnl_usd"] == 0.0 and r["pnl_pct"] is None, r

    # Kismi satis: 100 alindi, 40 satildi
    r = realized_pnl([
        swap("BUY", "DDD", 100, 100, "2026-01-01"),
        swap("SELL", "DDD", 40, 80, "2026-01-02"),
    ])
    assert r["round_trips"] == 1 and r["cost_usd"] == 40.0 and r["pnl_usd"] == 40.0, r
    assert r["open_positions"] == 1, r

    # Zarar da dogru sayilmali
    r = realized_pnl([
        swap("BUY", "EEE", 10, 1000, "2026-01-01"),
        swap("SELL", "EEE", 10, 400, "2026-01-02"),
    ])
    assert r["wins"] == 0 and r["pnl_usd"] == -600.0 and r["win_rate"] == 0.0, r

    # Ayni sembol farkli zincirde ayri takip edilmeli
    a = swap("BUY", "FFF", 10, 100, "2026-01-01")
    b = swap("SELL", "FFF", 10, 200, "2026-01-02"); b["chain"] = "arbitrum"
    r = realized_pnl([a, b])
    assert r["round_trips"] == 0 and r["unmatched_sells"] == 1, r

    print("copy_history self-check OK")
