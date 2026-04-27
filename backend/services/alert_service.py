# ============================================================
# alert_service.py
# ============================================================
# Rule-based alert uretimi. Su an 3 tip alert var:
#  - Strong Increase: 24h'te >= %5 yukselis
#  - Sharp Drop: 24h'te <= -%5 dusus
#  - Rapid Movement: kisa sureli (snapshot'lar arasi) hizli hareket
#
# NOT: Rapid Movement sorgusu iyilestirilecek (Faz 2). Su anki
# hali snapshot'lar arasi karsilastirmayi rastgele yapiyor. Simdilik
# calisir durumda birakiyoruz, Faz 2'de duzgun bir window mantigina
# cevirecegiz.
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor

def get_alerts(
    strong_increase_threshold=5.0,
    sharp_drop_threshold=-5.0,
    rapid_movement_threshold=2.0
):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    alerts = []

    # -------------------------------------------
    # 24h ALERTS: Strong Increase + Sharp Drop
    # -------------------------------------------
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
                "type": "Strong Increase",
                "severity": "Medium",
                "symbol": row["symbol"],
                "message": f"{row['symbol']} increased by {pct:.2f}% in the last 24h"
            })
        elif pct <= sharp_drop_threshold:
            alerts.append({
                "type": "Sharp Drop",
                "severity": "High",
                "symbol": row["symbol"],
                "message": f"{row['symbol']} dropped by {abs(pct):.2f}% in the last 24h"
            })

    # -------------------------------------------
    # RAPID MOVEMENT: price_history snapshot'lari arasindaki
    # en son karsilastirma. Her coin icin ilk denk gelen
    # karsilastirma alinir (seen set'i sayesinde).
    # Bu sorgu Faz 2'de daha saglam window-based hale gelecek.
    # -------------------------------------------
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
                "type": "Rapid Movement",
                "severity": "Low",
                "symbol": symbol,
                "message": f"{symbol} shows {direction} movement of {pct:.2f}% between recent snapshots"
            })
            seen.add(symbol)

    cursor.close()
    conn.close()

    # Severity sirasi: High > Medium > Low
    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    alerts = sorted(alerts, key=lambda x: severity_order.get(x["severity"], 99))

    return alerts