# ============================================================
# src/catalog_sync.py
# ============================================================
# CoinGecko'dan coin metadata'sini cekip coins tablosunu
# gunceller. Gunluk 1 kere calistirmak yeterli.
#
# Calistirma: python src/catalog_sync.py
# ============================================================

import time
import requests
import logging
from datetime import datetime
import os
from db import get_connection

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("catalog_sync")

COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets"


def fetch_coingecko(page=1, per_page=250):
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": per_page,
        "page": page,
        "sparkline": "false",
        # ATH/ATL icin price_change_percentage gerekmiyor ama
        # CoinGecko markets endpoint'i ath/atl'yi varsayilan doner
    }
    response = requests.get(COINGECKO_URL, params=params, timeout=15)
    response.raise_for_status()
    return response.json()


def parse_date(date_str):
    """CoinGecko ISO8601 tarihini MySQL DATE'e cevirir."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).strftime(
            "%Y-%m-%d"
        )
    except Exception:
        return None


def safe_int(val):
    """Float supply degerlerini INT'e cevirir, None'u korur."""
    if val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError, OverflowError):
        return None


def sync():
    logger.info("Catalog sync started.")

    coins = []
    for page in range(1, 21):  # top 5000 coin (20 × 250)
        try:
            data = fetch_coingecko(page=page)
            if not data:
                break
            coins.extend(data)
            logger.info(f"Page {page}: {len(data)} coins fetched.")
            time.sleep(6.0)  # Respect CoinGecko API rate limits (avoid 429)
        except Exception as e:
            logger.error(f"CoinGecko fetch error (page {page}): {e}")
            break

    if not coins:
        logger.error("No coins fetched, aborting.")
        return

    conn = get_connection()
    cursor = conn.cursor()

    updated = 0
    inserted = 0
    seen_symbols = set()

    try:
        for coin in coins:
            symbol = coin.get("symbol", "").upper()
            name = coin.get("name", "")
            slug = coin.get("id", "")
            image_url = coin.get("image", "")
            rank = coin.get("market_cap_rank")
            ath = coin.get("ath")
            ath_date = parse_date(coin.get("ath_date"))
            atl = coin.get("atl")
            atl_date = parse_date(coin.get("atl_date"))
            circ = safe_int(coin.get("circulating_supply"))
            total = safe_int(coin.get("total_supply"))
            max_s = safe_int(coin.get("max_supply"))

            if not symbol:
                continue
                
            # CoinGecko's first appearance of a symbol is the highest market cap.
            # Skip any subsequent coins with the same symbol in this run.
            if symbol in seen_symbols:
                continue
            seen_symbols.add(symbol)

            cursor.execute(
                """
                INSERT INTO coins
                    (symbol, name, slug, image_url, market_cap_rank,
                     ath, ath_date, atl, atl_date,
                     circulating_supply, total_supply, max_supply)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON DUPLICATE KEY UPDATE
                    name               = VALUES(name),
                    slug               = COALESCE(NULLIF(VALUES(slug),''), slug),
                    image_url          = COALESCE(NULLIF(VALUES(image_url),''), image_url),
                    market_cap_rank    = COALESCE(VALUES(market_cap_rank), market_cap_rank),
                    ath                = COALESCE(VALUES(ath), ath),
                    ath_date           = COALESCE(VALUES(ath_date), ath_date),
                    atl                = COALESCE(VALUES(atl), atl),
                    atl_date           = COALESCE(VALUES(atl_date), atl_date),
                    circulating_supply = COALESCE(VALUES(circulating_supply), circulating_supply),
                    total_supply       = COALESCE(VALUES(total_supply), total_supply),
                    max_supply         = COALESCE(VALUES(max_supply), max_supply)
                """,
                (
                    symbol, name, slug, image_url, rank,
                    ath, ath_date, atl, atl_date,
                    circ, total, max_s
                )
            )
            inserted += 1

        conn.commit()
        logger.info(f"Sync complete: {updated} updated, {inserted} inserted.")

    except Exception as e:
        conn.rollback()
        logger.error(f"Sync error: {e}", exc_info=True)
    finally:
        cursor.close()
        conn.close()


def daemon_mode():
    interval = int(os.environ.get("CATALOG_SYNC_INTERVAL", 21600)) # Default 6 hours
    logger.info(f"Starting catalog_sync daemon mode (interval: {interval}s)")
    while True:
        try:
            sync()
        except Exception as e:
            logger.error(f"Daemon sync error: {e}")
        logger.info(f"Sleeping for {interval} seconds...")
        time.sleep(interval)

if __name__ == "__main__":
    if os.environ.get("DAEMON_MODE") == "1":
        daemon_mode()
    else:
        sync()
