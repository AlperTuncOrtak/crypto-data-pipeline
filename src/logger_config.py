import logging
import os
import sys


def setup_logger():
    # Create logs directory if it does not exist
    os.makedirs("logs", exist_ok=True)

    logger = logging.getLogger("crypto_pipeline")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s"
    )

    # File handler
    file_handler = logging.FileHandler("logs/pipeline.log")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # Console handler -> force stdout instead of stderr
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setLevel(logging.INFO)
    stream_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)

    return logger