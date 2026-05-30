from shared.db import get_connection
from pymysql.cursors import DictCursor
import pandas as pd


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
            WHERE c.symbol IN ({placeholders})
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
            WHERE c.symbol IN ({placeholders})
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


def get_correlation_matrix(symbols, hours=24):
    if not symbols or len(symbols) < 2:
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
            WHERE c.symbol IN ({placeholders})
              AND ph.collected_at >= UTC_TIMESTAMP() - INTERVAL %s HOUR
            """
            cursor.execute(query, tuple(symbols) + (hours,))
            rows = cursor.fetchall()
        finally:
            cursor.close()
    finally:
        conn.close()

    if not rows:
        return []

    # Convert to DataFrame
    df = pd.DataFrame(rows)
    # Ensure current_price is float
    df['current_price'] = df['current_price'].astype(float)
    # Ensure collected_at is datetime
    df['collected_at'] = pd.to_datetime(df['collected_at'])

    # Bucket into 5-minute intervals
    df['time_bucket'] = df['collected_at'].dt.floor('5min')

    # Group by bucket and symbol, take the mean (or last) price in that bucket
    bucketed = df.groupby(['time_bucket', 'symbol'])['current_price'].mean().reset_index()

    # Pivot the table: rows = time_bucket, cols = symbol, values = current_price
    pivot_df = bucketed.pivot(index='time_bucket', columns='symbol', values='current_price')

    # Forward fill missing values, then drop any remaining NaNs
    pivot_df = pivot_df.ffill().dropna()

    if len(pivot_df) < 2:
        return []

    # Calculate Pearson correlation matrix
    corr_matrix = pivot_df.corr().round(4)

    # Format output for frontend
    results = []
    for sym1 in corr_matrix.index:
        for sym2 in corr_matrix.columns:
            results.append({
                "symbol_a": sym1,
                "symbol_b": sym2,
                "correlation": float(corr_matrix.loc[sym1, sym2])
            })
            
    return results
