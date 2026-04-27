# ============================================================
# backend/services/coin_service.py
# ============================================================
# Coin Detail sayfasinin DB sorgulari:
#  - get_coin_by_slug: Tek bir coin'in metadata + en guncel
#    fiyatini doner
#  - get_coin_history: Belirli bir time range icin price_history
#    noktalari (chart icin)
#  - get_coin_stats: 24h high/low gibi turetilmis stat'lar
#
# NOT: Time range parametresi enum benzeri string:
#   "1h" / "24h" / "7d" / "30d" / "all"
# Her biri farkli bir SQL INTERVAL'a cevirilir.
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor


# Frontend'den gelen string'i SQL INTERVAL'a ceviren tablo.
# "all" durumunda hic INTERVAL filtresi yok, hepsini doner.
RANGE_TO_INTERVAL = {
    "1h": "1 HOUR",
    "24h": "1 DAY",
    "7d": "7 DAY",
    "30d": "30 DAY",
}


# -----------------------
# COIN BY SLUG
# -----------------------
# URL'den gelen slug ile coin'i bul, en guncel fiyat bilgisiyle birlestir.
# 404 mantigini caller (endpoint) yapar - bu fonksiyon None doner.
def get_coin_by_slug(slug):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    query = """
    SELECT
        c.id, c.symbol, c.name, c.slug, c.image_url,
        lp.current_price, lp.market_cap, lp.total_volume,
        lp.price_change_24h, lp.price_change_percentage_24h,
        lp.updated_at
    FROM coins c
    LEFT JOIN latest_prices lp ON lp.coin_id = c.id
    WHERE c.slug = %s
    LIMIT 1
    """

    cursor.execute(query, (slug,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()
    return result


# -----------------------
# COIN HISTORY
# -----------------------
# Belirli bir zaman araligi icin coin'in fiyat geçmisi.
# Range "all" ise hepsini doner, diger durumlarda INTERVAL filtresi.
def get_coin_history(slug, range_key="24h"):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    if range_key == "all":
        # Tum geçmisi don
        query = """
        SELECT ph.current_price, ph.collected_at
        FROM price_history ph
        JOIN coins c ON ph.coin_id = c.id
        WHERE c.slug = %s
        ORDER BY ph.collected_at ASC
        """
        cursor.execute(query, (slug,))
    else:
        # INTERVAL ile filtrele
        interval = RANGE_TO_INTERVAL.get(range_key, "1 DAY")
        # NOT: INTERVAL string'i parametre olarak gondermek riskli
        # (SQL injection), ama biz kontrol ettigimiz bir whitelist'ten
        # geliyor (RANGE_TO_INTERVAL), bu yuzden f-string kullaniyoruz.
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

    # Frontend'in islemesini kolaylastirmak icin format
    return [
        {
            "price": float(r["current_price"]) if r["current_price"] else None,
            "time": r["collected_at"].isoformat() if r["collected_at"] else None,
        }
        for r in results
    ]


# -----------------------
# COIN STATS
# -----------------------
# Turetilmis stat'lar: 24h high, 24h low, kac data point var.
# Frontend'de coin sayfasinin ust kisminda kart olarak gosterilir.
def get_coin_stats(slug):
    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    query = """
    SELECT
        MIN(ph.current_price) AS low_24h,
        MAX(ph.current_price) AS high_24h,
        COUNT(*) AS data_points
    FROM price_history ph
    JOIN coins c ON ph.coin_id = c.id
    WHERE c.slug = %s
      AND ph.collected_at >= NOW() - INTERVAL 1 DAY
    """

    cursor.execute(query, (slug,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if not result:
        return {"low_24h": None, "high_24h": None, "data_points": 0}

    return {
        "low_24h": float(result["low_24h"]) if result["low_24h"] else None,
        "high_24h": float(result["high_24h"]) if result["high_24h"] else None,
        "data_points": int(result["data_points"]),
    }