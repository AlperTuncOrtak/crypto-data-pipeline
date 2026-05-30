import os
import redis
import json

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
if ("127.0.0.1" in REDIS_URL or "localhost" in REDIS_URL) and os.getenv("DB_PASSWORD") == "12345678":
    REDIS_URL = "redis://redis:6379/0"

r = redis.from_url(REDIS_URL, decode_responses=True)

QUOTE_ASSET = "USDT"

# ──────────────────────────────────────────────────────────────
# Gainers / Losers stabilite eşiği
# ──────────────────────────────────────────────────────────────
# Gate.io + Bybit + OKX aynı coini farklı referans fiyatından
# hesaplar; düşük hacimli coinlerin change_24h değeri borsadan
# borsaya çok değişir ve liste sürekli titreşir.
#
# Çözüm: total_volume < MIN_VOLUME_USD olan coinler
# gainers/losers hesaplamasına dahil edilmez.
# $50.000 eşiği: ciddi likidite var ama küçük altcoin'ler de girer.
# İhtiyaca göre artırılabilir (100_000, 500_000 …).
MIN_VOLUME_USD = 50_000

# change_24h mutlak değeri bu eşiğin altındaysa listeden çık.
# Böylece ~0.00% ile titreşen stablecoin'ler (USDT, USDC) çıkar.
MIN_CHANGE_PCT = 0.5


def get_all_tickers(limit=500):
    symbols = list(r.smembers("tickers"))
    if not symbols:
        return []

    keys = [f"ticker:{symbol}USDT" for symbol in symbols]
    raw_values = r.mget(keys)

    results = []
    for symbol, raw in zip(symbols, raw_values):
        if raw:
            try:
                data = json.loads(raw)
                results.append(
                    {
                        "symbol": symbol,
                        "current_price": float(data.get("price", 0)),
                        "price_change_percentage_24h": float(data.get("change_24h", 0)),
                        "total_volume": float(data.get("volume", 0)),
                        "high_24h": float(data.get("high_24h", 0)),
                        "low_24h": float(data.get("low_24h", 0)),
                        "data_source": data.get("source", "unknown"),
                        "updated_at": str(data.get("ts", "")),
                    }
                )
            except Exception:
                pass

    results.sort(key=lambda x: x["total_volume"], reverse=True)
    return results[:limit]


def get_ticker(symbol):
    key = f"ticker:{symbol.upper()}{QUOTE_ASSET}"

    raw = r.get(key)
    if raw:
        try:
            data = json.loads(raw)
            return {
                "symbol": symbol.upper(),
                "current_price": float(data.get("price", 0)),
                "price_change_percentage_24h": float(data.get("change_24h", 0)),
                "total_volume": float(data.get("volume", 0)),
                "high_24h": float(data.get("high_24h", 0)),
                "low_24h": float(data.get("low_24h", 0)),
                "data_source": data.get("source", "unknown"),
                "updated_at": str(data.get("ts", "")),
            }
        except Exception:
            pass

    return None


def _eligible_for_ranking(ticker: dict) -> bool:
    """
    Gainers / Losers listesine girebilmek için:
      - volume >= MIN_VOLUME_USD  → düşük likidite = gürültülü change_24h
      - |change_24h| >= MIN_CHANGE_PCT  → stablecoin titrememesi
      - current_price > 0
    """
    volume = float(ticker.get("total_volume") or 0)
    change = abs(float(ticker.get("price_change_percentage_24h") or 0))
    price = float(ticker.get("current_price") or 0)
    return volume >= MIN_VOLUME_USD and change >= MIN_CHANGE_PCT and price > 0


def get_top_gainers(limit=5):
    # market_service limit*4 çekerek kendi filtrelerini uygular;
    # buradan da geniş bir havuz döndürüyoruz.
    tickers = get_all_tickers(2000)
    eligible = [t for t in tickers if _eligible_for_ranking(t)]
    ranked = sorted(
        eligible,
        key=lambda x: x["price_change_percentage_24h"],
        reverse=True,
    )
    return ranked[:limit]


def get_top_losers(limit=5):
    tickers = get_all_tickers(2000)
    eligible = [t for t in tickers if _eligible_for_ranking(t)]
    ranked = sorted(
        eligible,
        key=lambda x: x["price_change_percentage_24h"],
    )
    return ranked[:limit]


def get_highest_volume(limit=5):
    tickers = get_all_tickers(2000)
    # volume zaten azalan sırada geliyor; price > 0 filtresi yeterli
    eligible = [t for t in tickers if float(t.get("current_price") or 0) > 0]
    return eligible[:limit]
