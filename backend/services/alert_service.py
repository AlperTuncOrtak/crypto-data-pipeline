from shared.db import get_connection
from pymysql.cursors import DictCursor


def get_alerts(
    strong_increase_threshold=5.0,
    sharp_drop_threshold=-5.0,
    rapid_movement_threshold=2.0,
):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    alerts = []

    def fmt_vol(v):
        v = float(v or 0)
        if v >= 1e9:
            return f"${v/1e9:.2f}B"
        if v >= 1e6:
            return f"${v/1e6:.2f}M"
        if v >= 1e3:
            return f"${v/1e3:.2f}K"
        return f"${v:.2f}"

    try:
        # ── 24h ALERTS ───────────────────────────────────────────
        # latest_prices tablosu zaten anlık — küçük, hızlı sorgu.
        query_24h = """
        SELECT
            c.symbol,
            lp.price_change_percentage_24h,
            lp.current_price,
            lp.total_volume
        FROM latest_prices lp
        JOIN coins c ON lp.coin_id = c.id
        WHERE lp.price_change_percentage_24h IS NOT NULL
        """
        cursor.execute(query_24h)
        rows_24h = cursor.fetchall()

        for row in rows_24h:
            pct = float(row["price_change_percentage_24h"] or 0)
            price = float(row["current_price"] or 0)
            volume = float(row["total_volume"] or 0)

            if pct >= strong_increase_threshold:
                alerts.append(
                    {
                        "type": "Strong Increase",
                        "severity": "Medium",
                        "symbol": row["symbol"],
                        "change_pct": round(pct, 2),
                        "current_price": price,
                        "total_volume": volume,
                        "message": f"+{pct:.2f}% in 24h · Vol {fmt_vol(volume)}",
                    }
                )
            elif pct <= sharp_drop_threshold:
                alerts.append(
                    {
                        "type": "Sharp Drop",
                        "severity": "High",
                        "symbol": row["symbol"],
                        "change_pct": round(pct, 2),
                        "current_price": price,
                        "total_volume": volume,
                        "message": f"{pct:.2f}% in 24h · Vol {fmt_vol(volume)}",
                    }
                )

        # ── RAPID MOVEMENT ────────────────────────────────────────
        # ESKİ SORUN: Tüm price_history tablosunu kendisiyle JOIN
        # ediyordu — zaman filtresi yoktu. Tablo büyüdükçe dakikalar
        # alırdı ve /alerts endpoint'i timeout'a girerdi.
        #
        # YENİ YAKLAŞIM:
        #   - ph1: son 10 dakikada yazılmış snapshot'lar (anlık fiyat)
        #   - ph2: ph1'den tam 30 dakika önceki snapshot
        #     (±5 dakika tolerans — snapshot her 30sn'de bir yazılıyor,
        #      arada boşluk olabilir)
        #   - Sadece bu dar pencereyi JOIN ediyoruz → çok hızlı
        #   - price_history(coin_id, collected_at) index'i bu sorguyu
        #     milisaniyelerde bitirir
        query_momentum = """
        SELECT c.symbol,
               ((ph1.current_price - ph2.current_price)
                / ph2.current_price) * 100 AS price_change_pct,
               ph1.current_price,
               lp.total_volume
        FROM price_history ph1
        JOIN price_history ph2
            ON  ph1.coin_id = ph2.coin_id
            AND ph2.collected_at BETWEEN
                    ph1.collected_at - INTERVAL 35 MINUTE
                AND ph1.collected_at - INTERVAL 25 MINUTE
        JOIN coins c ON ph1.coin_id = c.id
        LEFT JOIN latest_prices lp ON lp.coin_id = c.id
        WHERE ph1.collected_at >= UTC_TIMESTAMP() - INTERVAL 10 MINUTE
        ORDER BY ABS(
            (ph1.current_price - ph2.current_price) / ph2.current_price
        ) DESC
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
                direction = "up" if pct > 0 else "down"
                volume = float(row["total_volume"] or 0)
                alerts.append(
                    {
                        "type": "Rapid Movement",
                        "severity": "Low",
                        "symbol": symbol,
                        "change_pct": round(pct, 2),
                        "current_price": float(row["current_price"] or 0),
                        "total_volume": volume,
                        "message": f"Rapid {direction}ward · {pct:+.2f}% · Vol {fmt_vol(volume)}",
                    }
                )
                seen.add(symbol)

    finally:
        cursor.close()
        conn.close()

    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    alerts = sorted(
        alerts,
        key=lambda x: (
            severity_order.get(x["severity"], 99),
            -abs(x.get("change_pct", 0)),
        ),
    )

    return alerts
