# ============================================================
# backend/services/coin_service.py
# ============================================================
# Coin Detail sayfasi icin sorgular.
#
# Faz 2 hybrid yaklasim:
#  - Guncel fiyat, high/low, volume: Redis
#  - name, slug, image_url, market_cap: DB
#  - price_history (chart): DB (snapshotter her 30s'de yaziyor)
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor
from backend.services.redis_service import get_ticker

RANGE_TO_INTERVAL = {
    "1h":  "1 HOUR",
    "24h": "1 DAY",
    "7d":  "7 DAY",
    "30d": "30 DAY",
}


# -----------------------
# COIN BY SLUG
# -----------------------
def get_coin_by_slug(slug):
    # Once DB'den metadata al
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT c.id, c.symbol, c.name, c.slug, c.image_url,
               lp.market_cap
        FROM coins c
        LEFT JOIN latest_prices lp ON lp.coin_id = c.id
        WHERE c.slug = %s
        LIMIT 1
    """, (slug,))
    coin = cursor.fetchone()
    cursor.close()
    conn.close()

    if not coin:
        return None

    # Redis'ten live fiyat al
    ticker = get_ticker(coin["symbol"])

    if ticker:
        return {
            **coin,
            "current_price":               ticker["current_price"],
            "price_change_percentage_24h": ticker["price_change_percentage_24h"],
            "total_volume":                ticker["total_volume"],
            "high_24h":                    ticker["high_24h"],
            "low_24h":                     ticker["low_24h"],
            "updated_at":                  ticker["updated_at"],
        }

    # Redis'te yoksa DB'den fallback
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT lp.current_price, lp.total_volume,
               lp.price_change_percentage_24h, lp.updated_at
        FROM latest_prices lp
        WHERE lp.coin_id = %s
    """, (coin["id"],))
    lp = cursor.fetchone()
    cursor.close()
    conn.close()

    if lp:
        return {**coin, **lp}

    return coin


# -----------------------
# COIN HISTORY
# -----------------------
def get_coin_history(slug, range_key="24h"):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    if range_key == "all":
        query = """
        SELECT ph.current_price, ph.collected_at
        FROM price_history ph
        JOIN coins c ON ph.coin_id = c.id
        WHERE c.slug = %s
        ORDER BY ph.collected_at ASC
        """
        cursor.execute(query, (slug,))
    else:
        interval = RANGE_TO_INTERVAL.get(range_key, "1 DAY")
        query = f"""
        SELECT ph.current_price, ph.collected_at
        FROM price_history ph
        JOIN coins c ON ph.coin_id = c.id
        WHERE c.slug = %s
          AND ph.collected_at >= NOW() - INTERVAL {interval}
        ORDER BY ph.collected_at ASC
        """
        cursor.execute(query, (slug,))

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "price": float(r["current_price"]) if r["current_price"] else None,
            "time":  r["collected_at"].isoformat() if r["collected_at"] else None,
        }
        for r in results
    ]


# -----------------------
# COIN STATS
# -----------------------
def get_coin_stats(slug):
    # Redis'ten live high/low al
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("SELECT symbol FROM coins WHERE slug = %s", (slug,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if row:
        ticker = get_ticker(row["symbol"])
        if ticker:
            # DB'den data_points say
            conn = get_connection()
            cursor = conn.cursor(DictCursor)
            cursor.execute("""
                SELECT COUNT(*) AS data_points
                FROM price_history ph
                JOIN coins c ON ph.coin_id = c.id
                WHERE c.slug = %s
                  AND ph.collected_at >= NOW() - INTERVAL 1 DAY
            """, (slug,))
            cnt = cursor.fetchone()
            cursor.close()
            conn.close()

            return {
                "high_24h":    ticker["high_24h"],
                "low_24h":     ticker["low_24h"],
                "data_points": cnt["data_points"] if cnt else 0,
            }

    # Fallback: DB'den hesapla
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT MIN(ph.current_price) AS low_24h,
               MAX(ph.current_price) AS high_24h,
               COUNT(*) AS data_points
        FROM price_history ph
        JOIN coins c ON ph.coin_id = c.id
        WHERE c.slug = %s
          AND ph.collected_at >= NOW() - INTERVAL 1 DAY
    """, (slug,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        return {"low_24h": None, "high_24h": None, "data_points": 0}

    return {
        "low_24h":     float(result["low_24h"]) if result["low_24h"] else None,
        "high_24h":    float(result["high_24h"]) if result["high_24h"] else None,
        "data_points": int(result["data_points"]),
    }