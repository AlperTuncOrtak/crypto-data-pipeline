# ============================================================
# backend/services/redis_service.py
# ============================================================
# Backend'in Redis cache'inden veri okuyan servis.
# Worker Redis'e yazar, backend buradan okur.
# ============================================================

import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

QUOTE_ASSET = "USDT"


def get_all_tickers(limit=100):
    """
    Redis'teki tum ticker'lari cek, market cap yoksa volume'a gore sirala.
    """
    symbols = r.smembers("tickers")
    if not symbols:
        return []

    results = []
    for symbol in symbols:
        data = r.hgetall(f"ticker:{symbol}")
        if not data:
            continue

        base = symbol[:-len(QUOTE_ASSET)]  # BTCUSDT -> BTC

        results.append({
            "symbol":                    base,
            "current_price":             float(data.get("price", 0)),
            "price_change_percentage_24h": float(data.get("change_pct", 0)),
            "total_volume":              float(data.get("volume", 0)),
            "high_24h":                  float(data.get("high_24h", 0)),
            "low_24h":                   float(data.get("low_24h", 0)),
            "updated_at":                data.get("updated_at", ""),
        })

    # Volume'a gore sirala (market cap yok Binance'te)
    results.sort(key=lambda x: x["total_volume"], reverse=True)
    return results[:limit]


def get_ticker(symbol):
    """
    Tek bir coin'in Redis'teki verisini don.
    symbol: "BTC" (USDT olmadan)
    """
    key = f"ticker:{symbol.upper()}{QUOTE_ASSET}"
    data = r.hgetall(key)
    if not data:
        return None

    return {
        "symbol":                      symbol.upper(),
        "current_price":               float(data.get("price", 0)),
        "price_change_percentage_24h": float(data.get("change_pct", 0)),
        "total_volume":                float(data.get("volume", 0)),
        "high_24h":                    float(data.get("high_24h", 0)),
        "low_24h":                     float(data.get("low_24h", 0)),
        "updated_at":                  data.get("updated_at", ""),
    }


def get_top_gainers(limit=5):
    tickers = get_all_tickers(500)
    sorted_tickers = sorted(
        tickers,
        key=lambda x: x["price_change_percentage_24h"],
        reverse=True
    )
    return sorted_tickers[:limit]


def get_top_losers(limit=5):
    tickers = get_all_tickers(500)
    sorted_tickers = sorted(
        tickers,
        key=lambda x: x["price_change_percentage_24h"]
    )
    return sorted_tickers[:limit]


def get_highest_volume(limit=5):
    tickers = get_all_tickers(500)
    return tickers[:limit]  # Zaten volume'a gore sirali