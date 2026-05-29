# ============================================================
# market_service.py
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor
from backend.services.redis_service import (
    get_all_tickers,
    get_top_gainers as redis_gainers,
    get_top_losers as redis_losers,
    get_highest_volume as redis_volume,
)

import re
import time

_metadata_cache = {}
_metadata_cache_time = 0
_METADATA_TTL = 300  # 5 dakika

# ──────────────────────────────────────────────────────────────
# Türev / kaldıraçlı token filtresi
# ──────────────────────────────────────────────────────────────
# Gainers, losers, volume ve trending listelerinde kaldıraçlı
# ETF tokenlerinin (BTC3L, ETH5S, ZEC3L, FIL5S …) görünmesini
# önler.  Aynı regex multi_exchange_ws.py ve main.py'de de var;
# bu katman Redis'teki eski kayıtlara karşı ikinci güvencedir.
#
# Kural: sembol en az bir rakam + L/S ile bitiyorsa türev say.
#   BTC3L  → türev  ✓      SOLS → spot  ✗  (rakam yok)
#   FIL5S  → türev  ✓      BTC  → spot  ✗
_DERIVATIVE_RE = re.compile(r"\d+[LSls]$")


def _is_derivative(symbol: str) -> bool:
    """True → kaldıraçlı ETF token, False → normal spot coin."""
    return bool(_DERIVATIVE_RE.search((symbol or "").upper()))


def _filter_spot(coins: list, limit: int | None = None) -> list:
    """
    Verilen coin listesinden türev tokenleri çıkarır.
    limit verilirse sonucu o sayıyla keser (filtreleme sonrası).
    """
    result = [c for c in coins if not _is_derivative(c.get("symbol", ""))]
    return result[:limit] if limit is not None else result


# ──────────────────────────────────────────────────────────────


def _get_metadata():
    global _metadata_cache, _metadata_cache_time
    now = time.time()
    if now - _metadata_cache_time < _METADATA_TTL and _metadata_cache:
        return _metadata_cache

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute("""
                SELECT c.symbol, c.name, c.slug, c.image_url, c.circulating_supply,
                       lp.data_source, lp.last_updated, lp.market_cap, lp.current_price
                FROM coins c
                LEFT JOIN latest_prices lp ON lp.coin_id = c.id
            """)
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()

    _metadata_cache = {
        row["symbol"].upper(): {
            "name": row["name"],
            "slug": row["slug"],
            "image_url": row["image_url"],
            "data_source": row["data_source"] or "coingecko",
            "last_updated": (
                row["last_updated"].isoformat() if row["last_updated"] else None
            ),
            "market_cap": float(
                row.get("market_cap") or 
                (row.get("current_price") * row.get("circulating_supply") 
                 if row.get("current_price") and row.get("circulating_supply") else 0)
            ),
        }
        for row in rows
    }
    _metadata_cache_time = now
    return _metadata_cache


def _enrich(ticker):
    meta = _get_metadata()
    sym = ticker["symbol"].upper()
    info = meta.get(sym, {})
    return {
        **ticker,
        "name": info.get("name", sym),
        "slug": info.get("slug"),
        "image_url": info.get("image_url"),
        "data_source": info.get("data_source", "binance"),
        "last_updated": info.get("last_updated"),
        "market_cap": info.get("market_cap", 0),
    }


def get_latest_market(limit=100):
    tickers = get_all_tickers(limit)
    enriched = [_enrich(t) for t in tickers] if tickers else []
    redis_symbols = {t["symbol"].upper() for t in tickers} if tickers else set()

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                """
                SELECT c.symbol, c.name, c.slug, c.image_url,
                       lp.current_price, 
                       COALESCE(NULLIF(lp.market_cap, 0), lp.current_price * c.circulating_supply, 0) AS market_cap, 
                       lp.total_volume,
                       lp.price_change_percentage_24h, lp.updated_at,
                       lp.data_source, lp.last_updated
                FROM latest_prices lp
                JOIN coins c ON lp.coin_id = c.id
                WHERE lp.current_price > 0
                ORDER BY COALESCE(NULLIF(lp.market_cap, 0), lp.current_price * c.circulating_supply, 0) DESC
                LIMIT %s
            """,
                (limit,),
            )
            db_rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()

    for r in db_rows:
        if r.get("last_updated"):
            r["last_updated"] = r["last_updated"].isoformat()
        sym = r["symbol"].upper()
        if sym not in redis_symbols:
            enriched.append(r)

    # Market cap'e göre sırala — market_cap'i olmayan en sona
    enriched.sort(key=lambda x: float(x.get("market_cap") or 0), reverse=True)
    return enriched[:limit]


def get_top_gainers(limit=5):
    # Redis'ten çekilen liste türev içerebilir; fazladan al, filtrele, kes.
    tickers = redis_gainers(limit * 4)
    if not tickers:
        return _fallback_gainers(limit)
    enriched = [_enrich(t) for t in tickers]
    return _filter_spot(enriched, limit)


def get_top_losers(limit=5):
    tickers = redis_losers(limit * 4)
    if not tickers:
        return _fallback_losers(limit)
    enriched = [_enrich(t) for t in tickers]
    return _filter_spot(enriched, limit)


def get_highest_volume(limit=5):
    tickers = redis_volume(limit * 4)
    if not tickers:
        return _fallback_volume(limit)
    enriched = [_enrich(t) for t in tickers]
    return _filter_spot(enriched, limit)


def get_sparklines(symbols, hours=24):
    if not symbols:
        return {}

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            placeholders = ",".join(["%s"] * len(symbols))
            query = f"""
            SELECT c.symbol, ph.current_price, ph.collected_at
            FROM price_history ph
            JOIN coins c ON ph.coin_id = c.id
            WHERE c.symbol IN ({placeholders})
              AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL %s HOUR
            ORDER BY c.symbol ASC, ph.collected_at ASC
            """
            params = tuple(symbols) + (hours,)
            cursor.execute(query, params)
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()

    result = {}
    for row in rows:
        sym = row["symbol"]
        if sym not in result:
            result[sym] = []
        result[sym].append(
            {
                "price": float(row["current_price"]),
                "time": (
                    row["collected_at"].strftime("%Y-%m-%dT%H:%M:%SZ")
                    if row["collected_at"]
                    else None
                ),
            }
        )
    return result


# ──────────────────────────────────────────────────────────────
# DB fallback fonksiyonları
# ──────────────────────────────────────────────────────────────
# Redis boşken veya erişilemezken DB'den okur.
# SQL sorgularına NOT REGEXP filtresi eklenmiştir; bu sayede
# DB'de kalmış eski türev kayıtları da listeye girmez.
# MySQL REGEXP: '^.+[0-9][LSls]$'
# ──────────────────────────────────────────────────────────────

_DERIVATIVE_SQL = "c.symbol NOT REGEXP '[0-9][LSls]$'"


def _fallback_market(limit):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                f"""
                SELECT c.symbol, c.name, c.slug, c.image_url,
                       lp.current_price, 
                       COALESCE(NULLIF(lp.market_cap, 0), lp.current_price * c.circulating_supply, 0) AS market_cap, 
                       lp.total_volume,
                       lp.price_change_percentage_24h, lp.updated_at,
                       lp.data_source, lp.last_updated
                FROM latest_prices lp
                JOIN coins c ON lp.coin_id = c.id
                WHERE { _DERIVATIVE_SQL }
                ORDER BY COALESCE(NULLIF(lp.market_cap, 0), lp.current_price * c.circulating_supply, 0) DESC
                LIMIT %s
            """,
                (limit,),
            )
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()
    for r in rows:
        if r.get("last_updated"):
            r["last_updated"] = r["last_updated"].isoformat()
    return rows


def _fallback_gainers(limit):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                f"""
                SELECT c.symbol, c.name, c.slug, c.image_url,
                       lp.current_price, lp.price_change_percentage_24h,
                       lp.data_source, lp.last_updated
                FROM latest_prices lp
                JOIN coins c ON lp.coin_id = c.id
                WHERE lp.price_change_percentage_24h IS NOT NULL
                  AND {_DERIVATIVE_SQL}
                ORDER BY lp.price_change_percentage_24h DESC
                LIMIT %s
            """,
                (limit,),
            )
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()
    for r in rows:
        if r.get("last_updated"):
            r["last_updated"] = r["last_updated"].isoformat()
    return rows


def _fallback_losers(limit):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                f"""
                SELECT c.symbol, c.name, c.slug, c.image_url,
                       lp.current_price, lp.price_change_percentage_24h,
                       lp.data_source, lp.last_updated
                FROM latest_prices lp
                JOIN coins c ON lp.coin_id = c.id
                WHERE lp.price_change_percentage_24h IS NOT NULL
                  AND {_DERIVATIVE_SQL}
                ORDER BY lp.price_change_percentage_24h ASC
                LIMIT %s
            """,
                (limit,),
            )
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()
    for r in rows:
        if r.get("last_updated"):
            r["last_updated"] = r["last_updated"].isoformat()
    return rows


def _fallback_volume(limit):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                f"""
                SELECT c.symbol, c.name, c.slug, c.image_url,
                       lp.current_price, lp.total_volume,
                       lp.data_source, lp.last_updated
                FROM latest_prices lp
                JOIN coins c ON lp.coin_id = c.id
                WHERE lp.total_volume > 0
                  AND {_DERIVATIVE_SQL}
                ORDER BY lp.total_volume DESC
                LIMIT %s
            """,
                (limit,),
            )
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()
    for r in rows:
        if r.get("last_updated"):
            r["last_updated"] = r["last_updated"].isoformat()
    return rows
