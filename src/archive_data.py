from db import get_connection
import logging

logger = logging.getLogger("crypto_pipeline")


def archive_old_price_history(age_minutes=1):
    """
    Move old records from price_history to price_history_archive,
    then delete them from the main table.
    """

    conn = get_connection()
    cursor = conn.cursor()

    try:
        logger.info(f"Starting archive process for rows older than {age_minutes} minutes.")

        insert_query = """
        INSERT INTO price_history_archive (
            coin_id,
            current_price,
            market_cap,
            total_volume,
            price_change_24h,
            price_change_percentage_24h,
            collected_at
        )
        SELECT
            coin_id,
            current_price,
            market_cap,
            total_volume,
            price_change_24h,
            price_change_percentage_24h,
            collected_at
        FROM price_history
        WHERE collected_at < NOW() - INTERVAL %s MINUTE
        """
        cursor.execute(insert_query, (age_minutes,))
        archived_rows = cursor.rowcount

        delete_query = """
        DELETE FROM price_history
        WHERE collected_at < NOW() - INTERVAL %s MINUTE
        """
        cursor.execute(delete_query, (age_minutes,))
        deleted_rows = cursor.rowcount

        conn.commit()

        logger.info(f"{archived_rows} rows moved to price_history_archive.")
        logger.info(f"{deleted_rows} rows deleted from price_history.")

    except Exception as e:
        conn.rollback()
        logger.error(f"Archive process failed: {e}", exc_info=True)
        raise

    finally:
        cursor.close()
        conn.close()
        logger.info("Database connection closed after archive process.")