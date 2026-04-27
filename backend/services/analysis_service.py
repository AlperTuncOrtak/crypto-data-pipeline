# ============================================================
# analysis_service.py
# ============================================================
# Coklu coin karsilastirma ve performans analizi.
# Chart'lar icin history, karsilastirma tablosu icin performance.
# ============================================================

from shared.db import get_connection
from pymysql.cursors import DictCursor

# -----------------------
# MULTI-COIN HISTORY
# -----------------------
# Verilen sembollerin price_history'den tum fiyat noktalarini doner.
# Frontend chart'ta her coin icin bir line ciziyor.
#
# UYARI: Su an limit yok - coin sayisi + zaman uzadikca buyuyecek.
# Faz 2'de "son X saat" parametresi eklenecek.
def get_multi_coin_history(symbols):
    if not symbols:
        return []

    conn = get_connection()
    cursor = conn.cursor(DictCursor)

    # Dinamik placeholder (%s, %s, %s ...) - sembol sayisi kadar
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


# -----------------------
# MULTI-COIN PERFORMANCE
# -----------------------
# Her coin icin: ilk fiyat -> son fiyat, toplam getiri yuzdesi.
# En iyiden en kotuye siralanmis gelir.
#
# NOT: En az 2 data point gerekli. Tek snapshot olan coin atlanir.
# Bu kullanicinin UI'de bos gorunmesine sebep olabiliyor - Faz 2'de
# frontend'e "insufficient data" donecek sekilde guncellenecek.
def get_multi_coin_performance(symbols):
    if not symbols:
        return []

    conn = get_connection()
    cursor = conn.cursor(DictCursor)

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

    # Sembol bazinda gruplama
    grouped = {}
    for row in rows:
        symbol = row["symbol"]
        price = float(row["current_price"])

        if symbol not in grouped:
            grouped[symbol] = []
        grouped[symbol].append(price)

    # Her sembol icin ilk ve son fiyattan performans hesapla
    results = []
    for symbol, prices in grouped.items():
        if len(prices) < 2:
            continue  # Tek nokta varsa karsilastirma yapamayiz

        start_price = prices[0]
        latest_price = prices[-1]
        total_return_pct = ((latest_price - start_price) / start_price) * 100

        results.append({
            "symbol": symbol,
            "start_price": start_price,
            "latest_price": latest_price,
            "total_return_pct": total_return_pct
        })

    # En iyi performans en ustte
    results = sorted(results, key=lambda x: x["total_return_pct"], reverse=True)
    return results