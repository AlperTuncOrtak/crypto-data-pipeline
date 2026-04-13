import streamlit as st
from db import get_connection


@st.cache_data(ttl=120)
def get_total_tracked_coins():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM coins")
    result = cursor.fetchone()[0]

    cursor.close()
    conn.close()
    return result


@st.cache_data(ttl=120)
def get_latest_market_snapshot(limit=20):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT c.symbol, c.name, lp.current_price, lp.market_cap, lp.total_volume,
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


@st.cache_data(ttl=120)
def get_top_gainers(limit=5):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT c.symbol, lp.current_price, lp.price_change_percentage_24h
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    ORDER BY lp.price_change_percentage_24h DESC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()

    cursor.close()
    conn.close()
    return results


@st.cache_data(ttl=120)
def get_top_losers(limit=5):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT c.symbol, lp.current_price, lp.price_change_percentage_24h
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    ORDER BY lp.price_change_percentage_24h ASC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()

    cursor.close()
    conn.close()
    return results


@st.cache_data(ttl=120)
def get_highest_volume_coins(limit=5):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT c.symbol, lp.current_price, lp.total_volume
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


@st.cache_data(ttl=120)
def get_recent_price_changes(limit=10):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT c.symbol,
           ph1.current_price AS latest_price,
           ph2.current_price AS previous_price,
           (ph1.current_price - ph2.current_price) AS price_change,
           ((ph1.current_price - ph2.current_price) / ph2.current_price) * 100 AS price_change_pct
    FROM price_history ph1
    JOIN price_history ph2
        ON ph1.coin_id = ph2.coin_id
        AND ph1.collected_at > ph2.collected_at
    JOIN coins c ON ph1.coin_id = c.id
    ORDER BY ph1.collected_at DESC
    LIMIT %s
    """

    cursor.execute(query, (limit,))
    results = cursor.fetchall()

    cursor.close()
    conn.close()
    return results


@st.cache_data(ttl=120)
def get_multi_coin_history(symbols):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    placeholders = ",".join(["%s"] * len(symbols))

    query = f"""
    SELECT c.symbol, ph.current_price, ph.collected_at
    FROM price_history ph
    JOIN coins c ON ph.coin_id = c.id
    WHERE c.symbol IN ({placeholders})
    ORDER BY c.symbol ASC, ph.collected_at ASC
    """

    cursor.execute(query, tuple(symbols))
    results = cursor.fetchall()

    cursor.close()
    conn.close()
    return results


@st.cache_data(ttl=120)
def get_multi_coin_performance(symbols):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    placeholders = ",".join(["%s"] * len(symbols))

    query = f"""
    SELECT c.symbol, ph.current_price, ph.collected_at
    FROM price_history ph
    JOIN coins c ON ph.coin_id = c.id
    WHERE c.symbol IN ({placeholders})
    ORDER BY c.symbol ASC, ph.collected_at ASC
    """

    cursor.execute(query, tuple(symbols))
    rows = cursor.fetchall()

    cursor.close()
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

        results.append({
            "symbol": symbol,
            "start_price": start_price,
            "latest_price": latest_price,
            "total_return_pct": total_return_pct
        })

    results = sorted(results, key=lambda x: x["total_return_pct"], reverse=True)
    return results


@st.cache_data(ttl=120)
def get_alerts(
    strong_increase_threshold=5.0,
    sharp_drop_threshold=-5.0,
    rapid_movement_threshold=2.0
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    alerts = []

    # 24h movement alerts
    query_24h = """
    SELECT c.symbol, lp.price_change_percentage_24h
    FROM latest_prices lp
    JOIN coins c ON lp.coin_id = c.id
    WHERE lp.price_change_percentage_24h IS NOT NULL
    """
    cursor.execute(query_24h)
    rows_24h = cursor.fetchall()

    for row in rows_24h:
        pct = float(row["price_change_percentage_24h"])

        if pct >= strong_increase_threshold:
            alerts.append({
                "type": "🚀 Strong Increase",
                "severity": "Medium",
                "symbol": row["symbol"],
                "message": f"{row['symbol']} increased by {pct:.2f}% in the last 24h"
            })
        elif pct <= sharp_drop_threshold:
            alerts.append({
                "type": "🔻 Sharp Drop",
                "severity": "High",
                "symbol": row["symbol"],
                "message": f"{row['symbol']} dropped by {abs(pct):.2f}% in the last 24h"
            })

    # Short-term movement alerts
    query_momentum = """
    SELECT c.symbol,
           ((ph1.current_price - ph2.current_price) / ph2.current_price) * 100 AS price_change_pct
    FROM price_history ph1
    JOIN price_history ph2
        ON ph1.coin_id = ph2.coin_id
        AND ph1.collected_at > ph2.collected_at
    JOIN coins c ON ph1.coin_id = c.id
    ORDER BY ph1.collected_at DESC
    LIMIT 200
    """
    cursor.execute(query_momentum)
    rows = cursor.fetchall()

    seen = set()

    for row in rows:
        symbol = row["symbol"]
        if symbol in seen:
            continue

        pct = row["price_change_pct"]
        if pct is None:
            continue

        pct = float(pct)

        if abs(pct) >= rapid_movement_threshold:
            direction = "upward" if pct > 0 else "downward"
            alerts.append({
                "type": "⚡ Rapid Movement",
                "severity": "Low",
                "symbol": symbol,
                "message": f"{symbol} shows {direction} movement of {pct:.2f}% between recent snapshots"
            })
            seen.add(symbol)

    cursor.close()
    conn.close()

    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    alerts = sorted(alerts, key=lambda x: severity_order.get(x["severity"], 99))

    return alerts