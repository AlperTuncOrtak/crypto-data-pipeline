from fetch_data import fetch_crypto_data
from insert_data import insert_crypto_data
from archive_data import archive_old_price_history
from logger_config import setup_logger

logger = setup_logger()


def main():
    try:
        logger.info("Pipeline run started.")

        df = fetch_crypto_data()

        insert_crypto_data(df)

        archive_old_price_history(age_minutes=1440)

        logger.info("Pipeline run completed successfully.")

    except Exception as e:
        logger.error(f"Pipeline run failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()