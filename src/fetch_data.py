import requests
import pandas as pd
import logging

logger = logging.getLogger("crypto_pipeline")


def fetch_crypto_data():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": "false"
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()

    rows = []
    for coin in data:
        rows.append({
            "symbol": coin.get("symbol", "").upper(),
            "name": coin.get("name", ""),
            # CoinGecko'nun "id"si bizim slug'imiz olacak.
            # Ornek: "bitcoin", "ethereum", "wrapped-bitcoin".
            # URL'de /coin/{slug} olarak kullanilacak.
            "slug": coin.get("id", ""),
            "image_url": coin.get("image", ""),
            "current_price": coin.get("current_price"),
            "market_cap": coin.get("market_cap"),
            "total_volume": coin.get("total_volume"),
            "price_change_24h": coin.get("price_change_24h"),
            "price_change_percentage_24h": coin.get("price_change_percentage_24h")
        })

    df = pd.DataFrame(rows)

    logger.info(f"Fetched {len(df)} rows from CoinGecko API.")
    logger.info("Fetched data preview:")
    logger.info(f"\n{df.head()}")

    return df