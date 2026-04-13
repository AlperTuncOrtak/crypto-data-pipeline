from db import get_connection
import logging
import pandas as pd

logger = logging.getLogger("crypto_pipeline")


def clean_value(value, cast_func=None):
    """
    Convert pandas NaN/None values to Python None for MySQL.
    Optionally cast valid values with cast_func.
    """
    if pd.isna(value):
        return None
    return cast_func(value) if cast_func else value


def get_or_create_coin(cursor, symbol, name):
    cursor.execute(
        "SELECT id FROM coins WHERE symbol = %s",
        (symbol,)
    )
    result = cursor.fetchone()

    if result:
        return result[0]

    cursor.execute(
        "INSERT INTO coins (symbol, name) VALUES (%s, %s)",
        (symbol, name)
    )
    return cursor.lastrowid


def should_insert_history(cursor, coin_id, cooldown_seconds=60):
    query = """
        SELECT
            CASE
                WHEN MAX(collected_at) IS NULL THEN 1
                WHEN TIMESTAMPDIFF(SECOND, MAX(collected_at), NOW()) > %s THEN 1
                ELSE 0
            END AS should_insert
        FROM price_history
        WHERE coin_id = %s
    """
    cursor.execute(query, (cooldown_seconds, coin_id))
    result = cursor.fetchone()

    return bool(result[0])


def insert_price_history(cursor, coin_id, row):
    query = """
    INSERT INTO price_history (
        coin_id,
        current_price,
        market_cap,
        total_volume,
        price_change_24h,
        price_change_percentage_24h
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (
        coin_id,
        clean_value(row["current_price"], float),
        clean_value(row["market_cap"], int),
        clean_value(row["total_volume"], int),
        clean_value(row["price_change_24h"], float),
        clean_value(row["price_change_percentage_24h"], float),
    )
    cursor.execute(query, values)


def upsert_latest_price(cursor, coin_id, row):
    query = """
    INSERT INTO latest_prices (
        coin_id,
        current_price,
        market_cap,
        total_volume,
        price_change_24h,
        price_change_percentage_24h
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        current_price = VALUES(current_price),
        market_cap = VALUES(market_cap),
        total_volume = VALUES(total_volume),
        price_change_24h = VALUES(price_change_24h),
        price_change_percentage_24h = VALUES(price_change_percentage_24h),
        updated_at = CURRENT_TIMESTAMP
    """
    values = (
        coin_id,
        clean_value(row["current_price"], float),
        clean_value(row["market_cap"], int),
        clean_value(row["total_volume"], int),
        clean_value(row["price_change_24h"], float),
        clean_value(row["price_change_percentage_24h"], float),
    )
    cursor.execute(query, values)


def insert_crypto_data(df):
    conn = get_connection()
    cursor = conn.cursor()

    history_inserted = 0
    latest_updated = 0

    try:
        logger.info("Starting database insert process.")

        for _, row in df.iterrows():
            coin_id = get_or_create_coin(cursor, row["symbol"], row["name"])

            # Insert into history only if the last row is older than 5 minutes
            if should_insert_history(cursor, coin_id, cooldown_seconds=300):
                insert_price_history(cursor, coin_id, row)
                history_inserted += 1

            # Always update latest snapshot
            upsert_latest_price(cursor, coin_id, row)
            latest_updated += 1

        conn.commit()
        logger.info(f"{history_inserted} rows inserted into price_history.")
        logger.info(f"{latest_updated} rows upserted into latest_prices.")

    except Exception as e:
        conn.rollback()
        logger.error(f"Database insert failed: {e}", exc_info=True)
        raise

    finally:
        cursor.close()
        conn.close()
        logger.info("Database connection closed after insert process.")