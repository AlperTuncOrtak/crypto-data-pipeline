# ============================================================
# src/binance_ws.py
# ============================================================
# Binance WebSocket worker - Faz 2
#
# Yaklasim:
#  - DB'deki coins tablosundan sembolleri cek
#  - Her sembol icin "symbol@ticker" subscribe et
#  - Gelen veriyi Redis'e yaz
#  - Snapshotter 30s'de bir Redis -> DB yazar
# ============================================================

import json
import time
import threading
import logging
from datetime import datetime

import redis
import websocket

from db import get_connection

logger = logging.getLogger("binance_ws")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

SNAPSHOT_INTERVAL = 30
QUOTE_ASSET = "USDT"


# -----------------------
# DB'DEN SEMBOLLERI CEK
# -----------------------
def get_symbols_from_db():
    """
    coins tablosundaki sembolleri Binance formatina cevirir.
    BTC -> BTCUSDT, ETH -> ETHUSDT, vs.
    USDT, USDC gibi stable'lari atlar.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT symbol FROM coins")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    skip = {"USDT", "USDC", "BUSD", "DAI", "TUSD", "FDUSD"}
    symbols = []
    for row in rows:
        sym = row[0].upper()
        if sym in skip:
            continue
        symbols.append(f"{sym}{QUOTE_ASSET}".lower())  # btcusdt

    logger.info(f"Loaded {len(symbols)} symbols from DB.")
    return symbols


# -----------------------
# WEBSOCKET HANDLERS
# -----------------------
def on_message(ws, message):
    try:
        data = json.loads(message)
    except json.JSONDecodeError:
        return

    # Subscribe onay mesaji - atla
    if "result" in data:
        return

    # Ticker mesaji
    symbol = data.get("s", "")
    if not symbol.endswith(QUOTE_ASSET):
        return

    price      = data.get("c")   # Son fiyat
    change_pct = data.get("P")   # 24h %
    volume     = data.get("q")   # 24h quote volume
    high_24h   = data.get("h")   # 24h high
    low_24h    = data.get("l")   # 24h low
    market_cap = data.get("q")   # Binance market cap vermez, volume kullaniyoruz

    if not price:
        return

    r.hset(f"ticker:{symbol}", mapping={
        "price":      price,
        "change_pct": change_pct or "0",
        "volume":     volume or "0",
        "high_24h":   high_24h or "0",
        "low_24h":    low_24h or "0",
        "updated_at": datetime.utcnow().isoformat(),
    })
    r.sadd("tickers", symbol)


def on_error(ws, error):
    logger.error(f"WebSocket error: {error}")


def on_close(ws, close_status_code, close_msg):
    logger.warning(f"WebSocket closed: {close_status_code} {close_msg}")


def on_open(ws, symbols):
    logger.info(f"Connected. Subscribing to {len(symbols)} symbols...")

    # Binance max 200 stream per connection - batch'lere bol
    batch_size = 100
    for i in range(0, len(symbols), batch_size):
        batch = symbols[i:i + batch_size]
        params = [f"{s}@ticker" for s in batch]
        ws.send(json.dumps({
            "method": "SUBSCRIBE",
            "params": params,
            "id": i + 1,
        }))
        time.sleep(0.1)  # Rate limit icin kisa bekleme


# -----------------------
# SNAPSHOTTER
# -----------------------
def snapshotter():
    logger.info("Snapshotter started.")
    while True:
        time.sleep(SNAPSHOT_INTERVAL)
        try:
            _write_snapshot()
        except Exception as e:
            logger.error(f"Snapshot error: {e}", exc_info=True)


def _write_snapshot():
    symbols = r.smembers("tickers")
    if not symbols:
        logger.info("Snapshotter: no tickers in Redis yet.")
        return

    conn = get_connection()
    cursor = conn.cursor()

    inserted = 0
    updated = 0

    try:
        for symbol in symbols:
            data = r.hgetall(f"ticker:{symbol}")
            if not data:
                continue

            base = symbol[:-len(QUOTE_ASSET)]  # BTCUSDT -> BTC

            price      = float(data.get("price", 0))
            change_pct = float(data.get("change_pct", 0))
            volume     = float(data.get("volume", 0))

            cursor.execute(
                "SELECT id FROM coins WHERE symbol = %s", (base,)
            )
            result = cursor.fetchone()

            if not result:
                cursor.execute(
                    "INSERT INTO coins (symbol, name) VALUES (%s, %s)",
                    (base, base)
                )
                coin_id = cursor.lastrowid
            else:
                coin_id = result[0]

            # latest_prices upsert
            cursor.execute("""
                INSERT INTO latest_prices (
                    coin_id, current_price, total_volume,
                    price_change_percentage_24h, updated_at
                )
                VALUES (%s, %s, %s, %s, NOW())
                ON DUPLICATE KEY UPDATE
                    current_price = VALUES(current_price),
                    total_volume  = VALUES(total_volume),
                    price_change_percentage_24h = VALUES(price_change_percentage_24h),
                    updated_at    = NOW()
            """, (coin_id, price, volume, change_pct))
            updated += 1

            # price_history insert
            cursor.execute("""
                INSERT INTO price_history (
                    coin_id, current_price, total_volume,
                    price_change_percentage_24h
                )
                VALUES (%s, %s, %s, %s)
            """, (coin_id, price, volume, change_pct))
            inserted += 1

        conn.commit()
        logger.info(f"Snapshot: {updated} latest updated, {inserted} history inserted.")

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


# -----------------------
# MAIN
# -----------------------
def run():
    symbols = get_symbols_from_db()

    if not symbols:
        logger.error("No symbols in DB. Run the old worker first to populate coins table.")
        return

    # Snapshotter thread
    snap_thread = threading.Thread(target=snapshotter, daemon=True)
    snap_thread.start()

    while True:
        try:
            ws = websocket.WebSocketApp(
                'wss://stream.binance.com:9443/ws',
                on_open=lambda ws: on_open(ws, symbols),
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
            )
            ws.run_forever(ping_interval=30, ping_timeout=10)
        except Exception as e:
            logger.error(f"WebSocket crashed: {e}")

        logger.warning("Reconnecting in 5s...")
        time.sleep(5)


if __name__ == "__main__":
    run()