# ============================================================
# src/cleanup.py
# ============================================================
# price_history tablosunu temizler:
#  - 30 günden eski satirlari archive'a tasir
#  - 1 yildan eski archive satirlarini siler
#
# Calistirma: python src/cleanup.py
# Deploy sonrasi cron: 0 3 * * * (her gece 03:00)
# ============================================================

import logging
from db import get_connection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cleanup")


def run():
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 1) 30 günden eski satirlari archive'a tasI
        cursor.execute("""
            INSERT INTO price_history_archive
                (coin_id, current_price, market_cap, total_volume,
                 price_change_24h, price_change_percentage_24h, collected_at)
            SELECT
                coin_id, current_price, market_cap, total_volume,
                price_change_24h, price_change_percentage_24h, collected_at
            FROM price_history
            WHERE collected_at < NOW() - INTERVAL 30 DAY
        """)
        archived = cursor.rowcount
        logger.info(f"Archived {archived} rows.")

        # 2) Tasinan satirlari sil
        cursor.execute("""
            DELETE FROM price_history
            WHERE collected_at < NOW() - INTERVAL 30 DAY
        """)
        deleted = cursor.rowcount
        logger.info(f"Deleted {deleted} rows from price_history.")

        # 3) 1 yildan eski archive satirlarini sil
        cursor.execute("""
            DELETE FROM price_history_archive
            WHERE archived_at < NOW() - INTERVAL 365 DAY
        """)
        archive_deleted = cursor.rowcount
        logger.info(f"Deleted {archive_deleted} rows from archive.")

        conn.commit()
        logger.info("Cleanup complete.")

    except Exception as e:
        conn.rollback()
        logger.error(f"Cleanup error: {e}", exc_info=True)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    run()