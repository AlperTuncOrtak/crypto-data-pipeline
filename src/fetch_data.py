import requests
import pandas as pd
import logging

logger = logging.getLogger("crypto_pipeline")


def fetch_crypto_data():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    
    rows = []
    # 12 sayfa * 250 = 3000 coin
    import time
    for page in range(1, 13):
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 250,
            "page": page,
            "sparkline": "false"
        }
        
        retries = 3
        while retries > 0:
            try:
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 429:
                    logger.warning(f"Rate limited on page {page}. Waiting 15 seconds to retry...")
                    time.sleep(15)
                    retries -= 1
                    continue
                response.raise_for_status()
                data = response.json()
                break # Basarili
            except Exception as e:
                logger.error(f"Error fetching page {page}: {e}")
                data = None
                break
        
        if not data:
            logger.warning(f"No data for page {page}, stopping pagination.")
            break
            
        for coin in data:
            rows.append({
                "symbol": coin.get("symbol", "").upper(),
                "name": coin.get("name", ""),
                "slug": coin.get("id", ""),
                "image_url": coin.get("image", ""),
                "current_price": coin.get("current_price"),
                "market_cap": coin.get("market_cap"),
                "total_volume": coin.get("total_volume"),
                "price_change_24h": coin.get("price_change_24h"),
                "price_change_percentage_24h": coin.get("price_change_percentage_24h")
            })
            
        time.sleep(3.5) # API limitine takilmamak icin 3.5 sn bekle

    df = pd.DataFrame(rows)

    logger.info(f"Fetched {len(df)} rows from CoinGecko API.")
    logger.info("Fetched data preview:")
    logger.info(f"\n{df.head()}")

    return df