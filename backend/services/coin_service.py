# ============================================================
# backend/services/coin_service.py
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor
from backend.services.redis_service import get_ticker

RANGE_TO_INTERVAL = {
    "1h": "1 HOUR",
    "24h": "1 DAY",
    "7d": "7 DAY",
    "30d": "30 DAY",
}


def get_coin_by_slug(slug):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                """
                SELECT c.id, c.symbol, c.name, c.slug, c.image_url,
                       c.market_cap_rank,
                       c.ath, c.ath_date,
                       c.atl, c.atl_date,
                       c.circulating_supply, c.total_supply, c.max_supply,
                       lp.market_cap
                FROM coins c
                LEFT JOIN latest_prices lp ON lp.coin_id = c.id
                WHERE c.slug = %s
                LIMIT 1
            """,
                (slug,),
            )
            coin = cursor.fetchone()
        finally:
            cursor.close()
    finally:
        conn.close()

    if not coin:
        return None

    # Tarihleri string'e çevir
    for field in ("ath_date", "atl_date"):
        if coin.get(field):
            coin[field] = str(coin[field])

    # Redis'ten live fiyat
    ticker = get_ticker(coin["symbol"])
    if ticker:
        return {
            **coin,
            "current_price": ticker["current_price"],
            "price_change_percentage_24h": ticker["price_change_percentage_24h"],
            "total_volume": ticker["total_volume"],
            "high_24h": ticker["high_24h"],
            "low_24h": ticker["low_24h"],
            "updated_at": ticker["updated_at"],
        }

    # DB fallback
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                """
                SELECT lp.current_price, lp.total_volume,
                       lp.price_change_percentage_24h, lp.updated_at
                FROM latest_prices lp
                WHERE lp.coin_id = %s
            """,
                (coin["id"],),
            )
            lp = cursor.fetchone()
        finally:
            cursor.close()
    finally:
        conn.close()

    return {**coin, **(lp or {})}


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
          AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL {interval}
        ORDER BY ph.collected_at ASC
        """
        cursor.execute(query, (slug,))

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return [
        {
            "price": float(r["current_price"]) if r["current_price"] else None,
            "time": (
                r["collected_at"].strftime("%Y-%m-%dT%H:%M:%SZ")
                if r["collected_at"]
                else None
            ),
        }
        for r in results
    ]


def get_coin_stats(slug):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute("SELECT symbol FROM coins WHERE slug = %s", (slug,))
            row = cursor.fetchone()
        finally:
            cursor.close()
    finally:
        conn.close()

    if row:
        ticker = get_ticker(row["symbol"])
        if ticker:
            conn = get_connection()
            try:
                cursor = conn.cursor(DictCursor)
                try:
                    cursor.execute(
                        """
                        SELECT COUNT(*) AS data_points
                        FROM price_history ph
                        JOIN coins c ON ph.coin_id = c.id
                        WHERE c.slug = %s
                          AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY
                    """,
                        (slug,),
                    )
                    cnt = cursor.fetchone()
                finally:
                    cursor.close()
            finally:
                conn.close()
            return {
                "high_24h": ticker["high_24h"],
                "low_24h": ticker["low_24h"],
                "data_points": cnt["data_points"] if cnt else 0,
            }

    # DB fallback
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                """
                SELECT MIN(ph.current_price) AS low_24h,
                       MAX(ph.current_price) AS high_24h,
                       COUNT(*) AS data_points
                FROM price_history ph
                JOIN coins c ON ph.coin_id = c.id
                WHERE c.slug = %s
                  AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY
            """,
                (slug,),
            )
            result = cursor.fetchone()
        finally:
            cursor.close()
    finally:
        conn.close()

    if not result:
        return {"low_24h": None, "high_24h": None, "data_points": 0}

    return {
        "low_24h": float(result["low_24h"]) if result["low_24h"] else None,
        "high_24h": float(result["high_24h"]) if result["high_24h"] else None,
        "data_points": int(result["data_points"]),
    }
