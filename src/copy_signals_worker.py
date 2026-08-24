"""
Copy Trading sinyal tarayici.

Aktif balinalari periyodik tarar ve takaslarini copy_signals'a yazar.
Kalibi src/catalog_sync.py ile ayni: DAEMON_MODE=1 ile dongu, aksi halde
tek tur (elle calistirmak/test icin).

  python src/copy_signals_worker.py          # tek tur
  DAEMON_MODE=1 python src/copy_signals_worker.py
"""
import logging
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.copy_signals import scan_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("copy_signals_worker")

# 5 dakika. Faz 2'nin isi veri biriktirmek, gecikmenin onemi yok;
# daha sik taramak Alchemy kotasini bosa harciyor.
DEFAULT_INTERVAL = 300


def run_once():
    totals = scan_all()
    logger.info(
        "scan done: %d leaders, %d accepted, %d rejected",
        totals["leaders"], totals["accepted"], totals["rejected"],
    )
    return totals


def daemon_mode():
    interval = int(os.environ.get("COPY_SCAN_INTERVAL", DEFAULT_INTERVAL))
    logger.info("copy signals daemon starting (interval: %ds)", interval)
    while True:
        try:
            run_once()
        except Exception as e:
            logger.error("scan cycle failed: %s", e, exc_info=True)
        time.sleep(interval)


if __name__ == "__main__":
    if os.environ.get("DAEMON_MODE") == "1":
        daemon_mode()
    else:
        run_once()
