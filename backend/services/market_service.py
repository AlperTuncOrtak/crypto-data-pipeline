# ============================================================
# market_service.py
# ============================================================
# Faz 2: Hybrid yaklasim
#  - Fiyat verisi: Redis (live, hızlı)
#  - Metadata (name, slug, image_url): DB
#
# Redis'te coin yoksa (worker baslamadi vs.) DB'ye fallback.
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor
from backend.services.redis_service import (
    get_all_tickers,
    get_top_gainers as redis_gainers,
    get_top_losers as redis_losers,
    get_highest_volume as redis_volume,
)


# -----------------------
# METADATA CACHE
# -----------------------
# DB'den coin metadata'sini cek (symbol -> {name, slug, image_url})
# Bu veri nadiren degisir, her istekte DB'ye gitmeyelim.
# Basit in-process dict cache - 5 dakikada bir yenile.

import time
_metadata_cache = {}
_metadata_cache_time = 0
_METADATA_TTL = 300  # 5 dakika


def _get_metadata():
    global _metadata_cache, _metadata_cache_time

    now = time.time()
    if now - _metadata_cache_time < _METADATA_TTL and _metadata_cache:
        return _metadata_cache

    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("SELECT symbol, name, slug, image_url FROM coins")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    _metadata_cache = {
        row["symbol"].upper(): {
            "name":      row["name"],
            "slug":      row["slug"],
            "image_url": row["image_url"],
        }
        for row in rows
    }
    _metadata_cache_time = now
    return _metadata_cache


def _enrich(ticker):
    """Redis ticker'ına DB metadata'sını ekle."""
    meta = _get_metadata()
    sym = ticker["symbol"].upper()
    info = meta.get(sym, {})
    return {
        **ticker,
        "name":      info.get("name", sym),
        "slug":      info.get("slug"),
        "image_url": info.get("image_url"),
    }


# -----------------------
# PUBLIC FUNCTIONS
# -----------------------
def get_latest_market(limit=100):
    tickers = get_all_tickers(limit)
    if not tickers:
        return _fallback_market(limit)
    return [_enrich(t) for t in tickers]


def get_top_gainers(limit=5):
    tickers = redis_gainers(limit)
    if not tickers:
        return _fallback_gainers(limit)
    return [_enrich(t) for t in tickers]


def get_top_losers(limit=5):
    tickers = redis_losers(limit)
    if not tickers:
        return _fallback_losers(limit)
    return [_enrich(t) for t in tickers]


def get_highest_volume(limit=5):
    tickers = redis_volume(limit)
    if not tickers:
        return _fallback_volume(limit)
    return [_enrich(t) for t in tickers]


# -----------------------
# SPARKLINES (DB'den - Redis'te yok)
# -----------------------
def get_sparklines(symbols, hours=24):
    if not symbols:
        return {}

    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    placeholders = ",".join(["%s"] * len(symbols))
    query = f"""
    SELECT c.symbol, ph.current_price, ph.collected_at
    FROM price_history ph
    JOIN coins c ON ph.coin_id = c.id
    WHERE c.symbol IN ({placeholders})
      AND ph.collected_at >= NOW() - INTERVAL %s HOUR
    ORDER BY c.symbol ASC, ph.collected_at ASC
    """

    params = tuple(symbols) + (hours,)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = {}
    for row in rows:
        sym = row["symbol"]
        if sym not in result:
            result[sym] = []
        result[sym].append({
            "price": float(row["current_price"]),
            "time":  row["collected_at"].isoformat() if row["collected_at"] else None,
        })
    return result


# -----------------------
# FALLBACK (Redis bossa DB'ye don)
# -----------------------
def _fallback_market(limit):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT c.symbol, c.name, c.slug, c.image_url,
               lp.current_price, lp.market_cap, lp.total_volume,
               lp.price_change_percentage_24h, lp.updated_at
        FROM latest_prices lp
        JOIN coins c ON lp.coin_id = c.id
        ORDER BY lp.market_cap DESC
        LIMIT %s
    """, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


def _fallback_gainers(limit):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT c.symbol, c.name, c.slug, c.image_url,
               lp.current_price, lp.price_change_percentage_24h
        FROM latest_prices lp
        JOIN coins c ON lp.coin_id = c.id
        WHERE lp.price_change_percentage_24h IS NOT NULL
        ORDER BY lp.price_change_percentage_24h DESC
        LIMIT %s
    """, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


def _fallback_losers(limit):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT c.symbol, c.name, c.slug, c.image_url,
               lp.current_price, lp.price_change_percentage_24h
        FROM latest_prices lp
        JOIN coins c ON lp.coin_id = c.id
        WHERE lp.price_change_percentage_24h IS NOT NULL
        ORDER BY lp.price_change_percentage_24h ASC
        LIMIT %s
    """, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


def _fallback_volume(limit):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT c.symbol, c.name, c.slug, c.image_url,
               lp.current_price, lp.total_volume
        FROM latest_prices lp
        JOIN coins c ON lp.coin_id = c.id
        ORDER BY lp.total_volume DESC
        LIMIT %s
    """, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results