from shared.db import get_connection
from pymysql.cursors import DictCursor


def get_multi_coin_history(symbols, hours=24):
    if not symbols:
        return []

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            placeholders = ",".join(["%s"] * len(symbols))
            query = f"""
            SELECT c.symbol, ph.current_price, ph.collected_at
            FROM price_history ph
            JOIN coins c ON ph.coin_id = c.id
            WHERE c.symbol IN ({{placeholders}})
              AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL %s HOUR
            ORDER BY c.symbol ASC, ph.collected_at ASC
            """
            cursor.execute(query, tuple(symbols) + (hours,))
            results = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()
    return [
        {
            "symbol": r["symbol"],
            "current_price": float(r["current_price"]) if r["current_price"] else None,
            "time": (
                r["collected_at"].strftime("%Y-%m-%dT%H:%M:%SZ")
                if r["collected_at"]
                else None
            ),
        }
        for r in results
    ]


def get_multi_coin_performance(symbols, hours=24):
    if not symbols:
        return []

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            placeholders = ",".join(["%s"] * len(symbols))
            query = f"""
            SELECT c.symbol, ph.current_price, ph.collected_at
            FROM price_history ph
            JOIN coins c ON ph.coin_id = c.id
            WHERE c.symbol IN ({{placeholders}})
              AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL %s HOUR
            ORDER BY c.symbol ASC, ph.collected_at ASC
            """
            cursor.execute(query, tuple(symbols) + (hours,))
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()

    if not rows:
        return []

    grouped = {}
    for row in rows:
        symbol = row["symbol"]
        price = float(row["current_price"])
        if symbol not in grouped:
            grouped[symbol] = []
        grouped[symbol].append(price)

    results = []
    for symbol, prices in grouped.items():
        if len(prices) < 2:
            continue
        start_price = prices[0]
        latest_price = prices[-1]
        total_return_pct = ((latest_price - start_price) / start_price) * 100
        results.append(
            {
                "symbol": symbol,
                "start_price": start_price,
                "latest_price": latest_price,
                "total_return_pct": total_return_pct,
            }
        )

    return sorted(results, key=lambda x: x["total_return_pct"], reverse=True)
