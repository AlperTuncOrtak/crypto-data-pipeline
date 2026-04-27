# ============================================================
# market_service.py
# ============================================================
# Piyasa verisi ile ilgili DB sorgularini icerir.
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor


# -----------------------
# LATEST MARKET
# -----------------------
def get_latest_market(limit=20):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    query = """
    SELECT c.symbol, c.name, c.slug, c.image_url,
           lp.current_price, lp.market_cap, lp.total_volume,
           lp.price_change_percentage_24h, lp.updated_at
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    ORDER BY lp.market_cap DESC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


# -----------------------
# TOP GAINERS
# -----------------------
def get_top_gainers(limit=5):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    query = """
    SELECT c.symbol, c.name, c.slug, c.image_url,
           lp.current_price, lp.price_change_percentage_24h
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    WHERE lp.price_change_percentage_24h IS NOT NULL
    ORDER BY lp.price_change_percentage_24h DESC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


# -----------------------
# TOP LOSERS
# -----------------------
def get_top_losers(limit=5):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    query = """
    SELECT c.symbol, c.name, c.slug, c.image_url,
           lp.current_price, lp.price_change_percentage_24h
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    WHERE lp.price_change_percentage_24h IS NOT NULL
    ORDER BY lp.price_change_percentage_24h ASC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


# -----------------------
# HIGHEST VOLUME
# -----------------------
def get_highest_volume(limit=5):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    query = """
    SELECT c.symbol, c.name, c.slug, c.image_url,
           lp.current_price, lp.total_volume
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    ORDER BY lp.total_volume DESC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


# -----------------------
# SPARKLINES
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
            "time": row["collected_at"].isoformat() if row["collected_at"] else None,
        })

    return result