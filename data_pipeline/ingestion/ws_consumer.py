import asyncio
import json
import logging
import os
import time
from datetime import datetime
import pandas as pd
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ws_consumer")

# Configuration - Top 20 High Volume Coins
SYMBOLS = [
    "btcusdt", "ethusdt", "solusdt", "bnbusdt", "xrpusdt", 
    "adausdt", "avaxusdt", "dogeusdt", "dotusdt", "linkusdt",
    "maticusdt", "shibusdt", "trxusdt", "ltcusdt", "uniusdt",
    "atomusdt", "xlmusdt", "nearusdt", "aptusdt", "filusdt"
]
BATCH_SIZE = 5000  # Save to parquet every 5000 records
SAVE_INTERVAL = 60  # OR every 60 seconds
DATA_LAKE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data_lake", "raw_trades")

# Ensure directory exists
os.makedirs(DATA_LAKE_DIR, exist_ok=True)

class BinanceTradeConsumer:
    def __init__(self):
        self.buffer = []
        self.last_save_time = time.time()
        self.lock = asyncio.Lock()

    async def save_batch(self):
        async with self.lock:
            if not self.buffer:
                return

            df = pd.DataFrame(self.buffer)
            self.buffer = []
            self.last_save_time = time.time()

        # Write to parquet
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"trades_{timestamp_str}.parquet"
        filepath = os.path.join(DATA_LAKE_DIR, filename)
        
        try:
            # Cast types for efficiency and correctness
            df["price"] = df["price"].astype(float)
            df["quantity"] = df["quantity"].astype(float)
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            
            df.to_parquet(filepath, index=False, engine="pyarrow")
            logger.info(f"Saved {len(df)} trades to {filepath}")
        except Exception as e:
            logger.error(f"Error saving parquet file {filepath}: {e}")

    async def connect_and_listen(self):
        streams = "/".join([f"{symbol}@trade" for symbol in SYMBOLS])
        url = f"wss://stream.binance.com:9443/ws/{streams}"
        
        while True:
            try:
                logger.info(f"Connecting to {url}...")
                async with websockets.connect(url) as ws:
                    logger.info("Connected successfully.")
                    
                    while True:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        
                        trade_record = {
                            "symbol": data["s"],
                            "price": data["p"],
                            "quantity": data["q"],
                            "timestamp": data["T"],
                            "is_buyer_maker": data["m"]
                        }
                        
                        async with self.lock:
                            self.buffer.append(trade_record)
                        
                        # Check conditions to save
                        if len(self.buffer) >= BATCH_SIZE or (time.time() - self.last_save_time) >= SAVE_INTERVAL:
                            await self.save_batch()
                            
            except websockets.exceptions.ConnectionClosed as e:
                logger.warning(f"Connection closed: {e}. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Unexpected error: {e}. Reconnecting in 5 seconds...")
                await asyncio.sleep(5)

if __name__ == "__main__":
    consumer = BinanceTradeConsumer()
    try:
        asyncio.run(consumer.connect_and_listen())
    except KeyboardInterrupt:
        logger.info("Stopping consumer...")
        # Save remaining buffer before exiting
        if consumer.buffer:
            asyncio.run(consumer.save_batch())
        logger.info("Exited.")
