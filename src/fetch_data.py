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
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 429:
                logger.warning(f"Rate limited by CoinGecko on page {page}. Stopping pagination.")
                break
            response.raise_for_status()
            data = response.json()
            
            if not data:
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
                
            time.sleep(1.5) # API limitine takilmamak icin 1.5 sn bekle
        except Exception as e:
            logger.error(f"Error fetching page {page}: {e}")
            break

    df = pd.DataFrame(rows)

    logger.info(f"Fetched {len(df)} rows from CoinGecko API.")
    logger.info("Fetched data preview:")
    logger.info(f"\n{df.head()}")

    return df