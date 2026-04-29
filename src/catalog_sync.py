# ============================================================
# src/catalog_sync.py
# ============================================================
# Gunluk CoinGecko senkronizasyonu.
# Binance WebSocket sadece fiyat veriyor, metadata yok.
# Bu script CoinGecko'dan name, slug, image_url cekip
# coins tablosunu gunceller.
#
# Calistirma: python src/catalog_sync.py
# Cron icin: gunde 1 kere calistir (deploy sonrasi)
# ============================================================

import requests
import logging
from db import get_connection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
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
    }
    response = requests.get(COINGECKO_URL, params=params, timeout=15)
    response.raise_for_status()
    return response.json()


def sync():
    logger.info("Catalog sync started.")

    # CoinGecko'dan top 500 coin cek (2 sayfa)
    coins = []
    for page in range(1, 5):
        try:
            data = fetch_coingecko(page=page)
            coins.extend(data)
            logger.info(f"Page {page}: {len(data)} coins fetched.")
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

    try:
        for coin in coins:
            symbol    = coin.get("symbol", "").upper()
            name      = coin.get("name", "")
            slug      = coin.get("id", "")
            image_url = coin.get("image", "")

            if not symbol:
                continue

            # Mevcut kaydi kontrol et
            cursor.execute(
                "SELECT id, slug, image_url FROM coins WHERE symbol = %s",
                (symbol,)
            )
            result = cursor.fetchone()

            if result:
                coin_id        = result[0]
                existing_slug  = result[1]
                existing_image = result[2]

                updates = []
                values  = []

                if not existing_slug and slug:
                    updates.append("slug = %s")
                    values.append(slug)
                if not existing_image and image_url:
                    updates.append("image_url = %s")
                    values.append(image_url)
                # Her zaman name guncelle (degismis olabilir)
                updates.append("name = %s")
                values.append(name)

                values.append(coin_id)
                cursor.execute(
                    f"UPDATE coins SET {', '.join(updates)} WHERE id = %s",
                    tuple(values)
                )
                updated += 1
            else:
                # Yeni coin - insert
                cursor.execute(
                    "INSERT INTO coins (symbol, name, slug, image_url) VALUES (%s, %s, %s, %s)",
                    (symbol, name, slug, image_url)
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


if __name__ == "__main__":
    sync()