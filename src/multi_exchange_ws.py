"""
multi_exchange_ws.py
====================
Multi-Exchange WebSocket Price Feed

Borsalar:
  • Gate.io — ~2100 USDT pair
  • Bybit   — ~700  USDT pair
  • OKX     — ~300  USDT pair
  • CoinGecko REST fallback (10dk'da bir)
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
import os
from pathlib import Path
from dotenv import load_dotenv

import websockets
import aiohttp
import aiomysql
import redis.asyncio as aioredis

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "crypto_analysis")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "12345678")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SNAPSHOT_INTERVAL = int(os.getenv("SNAPSHOT_INTERVAL", "30"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("multi_ws")


# ──────────────────────────────────────────────────────────────
# Türev / kaldıraçlı token filtresi
# ──────────────────────────────────────────────────────────────
# Gate.io, Bybit ve OKX USDT spot listelerinde kaldıraçlı ETF
# tokenleri de bulunur (örn. BTC3L, ETH5S, ZEC3L, FIL5S).
# Bunlar normal spot coinler gibi davranmaz; fiyat/hacim
# verileri yanıltıcı olur ve trending/top listelerini bozar.
#
# Kural: sembol rakam + L/S harfiyle bitiyorsa türev say.
# Örnekler:  BTC3L ✓  ETH5S ✓  ZEC3L ✓  FIL5S ✓
#            BTC   ✗  SOLS  ✗  LINK  ✗  NEAR  ✗
#
# Not: SOLS (Solana meme coin) gibi masum semboller için
# "sadece çok tanınan suffix'ler" listesi tutmak yerine
# regex yeterince dar: \\d+[LSls]$ → en az bir rakam + L/S.
# SOLS sonu S ile biter ama başında rakam yoktur → geçer.
import re as _re

_DERIVATIVE_RE = _re.compile(r"\d+[LSls]$")


def is_derivative_symbol(symbol: str) -> bool:
    """
    True  → kaldıraçlı ETF token (BTC3L, ETH5S, ZEC3L …)
    False → normal spot coin
    """
    return bool(_DERIVATIVE_RE.search(symbol.upper()))


async def redis_write(r: aioredis.Redis, symbol: str, data: dict) -> None:
    key = f"ticker:{symbol}USDT"
    await r.set(key, json.dumps(data), ex=300)
    await r.sadd("tickers", symbol)

    # Volume anomali tespiti — sync redis_service kullanır
    volume = float(data.get("volume", 0) or 0)
    if volume > 0:
        try:
            import sys, os

            sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
            from backend.services.volume_anomaly import (
                update_volume_history,
                check_volume_spike,
                log_spike,
            )

            update_volume_history(symbol, volume)
            spike = check_volume_spike(symbol, volume)
            if spike:
                log_spike(spike, price=data.get("price"))
        except Exception as e:
            pass  # Anomaly detection opsiyonel, hata kritik değil


async def snapshot_to_db(r: aioredis.Redis, pool: aiomysql.Pool) -> None:
    symbols = await r.smembers("tickers")
    if not symbols:
        return

    rows_prices, rows_history = [], []
    now = datetime.now(timezone.utc)

    for sym in symbols:
        if isinstance(sym, bytes):
            sym = sym.decode()
        raw = await r.get(f"ticker:{sym}USDT")
        if not raw:
            continue
        try:
            d = json.loads(raw)
        except Exception:
            continue

        coin_id = d.get("coin_id")
        price = d.get("price")
        volume = d.get("volume", 0)
        change_24h = d.get("change_24h", 0)
        market_cap = d.get("market_cap", 0)
        high_24h = d.get("high_24h", 0)
        low_24h = d.get("low_24h", 0)
        source = d.get("source", "unknown")

        if coin_id is None or price is None:
            continue

        rows_prices.append(
            (coin_id, price, volume, change_24h, market_cap, source, now)
        )
        rows_history.append((coin_id, price, now))

    if not rows_prices:
        return

    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.executemany(
                """
    INSERT INTO latest_prices
      (coin_id, current_price, total_volume,
       price_change_percentage_24h, market_cap,
       data_source, last_updated)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
      current_price               = VALUES(current_price),
      total_volume                = VALUES(total_volume),
      price_change_percentage_24h = VALUES(price_change_percentage_24h),
      market_cap                  = IF(VALUES(market_cap) > 0, VALUES(market_cap), market_cap),
      data_source                 = VALUES(data_source),
      last_updated                = VALUES(last_updated)
    """,
                rows_prices,
            )

            await cur.executemany(
                "INSERT INTO price_history (coin_id, current_price, collected_at) VALUES (%s, %s, %s)",
                rows_history,
            )
        await conn.commit()

    log.info("Snapshot: %d coin yazıldı.", len(rows_prices))


async def snapshot_loop(r: aioredis.Redis, pool: aiomysql.Pool) -> None:
    while True:
        await asyncio.sleep(SNAPSHOT_INTERVAL)
        try:
            await snapshot_to_db(r, pool)
        except Exception as e:
            log.error("Snapshot hatası: %s", e)


async def load_coin_map(pool: aiomysql.Pool) -> dict:
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute("SELECT id, symbol FROM coins")
            rows = await cur.fetchall()
    mapping = {}
    for row in rows:
        sym = row["symbol"].upper()
        mapping[sym] = row["id"]
        mapping[sym + "USDT"] = row["id"]
    return mapping


async def ensure_coin(pool: aiomysql.Pool, coin_map: dict, symbol: str):
    if symbol in coin_map:
        return coin_map[symbol]
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT IGNORE INTO coins (symbol, name) VALUES (%s, %s)",
                    (symbol, symbol),
                )
                await conn.commit()
                await cur.execute("SELECT id FROM coins WHERE symbol = %s", (symbol,))
                row = await cur.fetchone()
                if row:
                    coin_id = row[0]
                    coin_map[symbol] = coin_id
                    coin_map[symbol + "USDT"] = coin_id
                    return coin_id
    except Exception as e:
        log.debug("ensure_coin hatası %s: %s", symbol, e)
    return None


# ──────────────────────────────────────────────────────────────
# ① Gate.io WebSocket
# ──────────────────────────────────────────────────────────────
class GateWS:
    WS_URL = "wss://api.gateio.ws/ws/v4/"
    REST_URL = "https://api.gateio.ws/api/v4/spot/tickers"
    SOURCE = "gate"

    def __init__(self, r, coin_map, pool):
        self.r = r
        self.coin_map = coin_map
        self.pool = pool

    async def _get_usdt_pairs(self):
        async with aiohttp.ClientSession() as s:
            async with s.get(
                self.REST_URL, timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
        pairs = [
            d["currency_pair"] for d in data if d["currency_pair"].endswith("_USDT")
        ]
        # Kaldıraçlı ETF tokenlerini (BTC3L, ETH5S …) listeden çıkar.
        # pair formatı "BTC3L_USDT" → base = pair[:-5]
        filtered = [p for p in pairs if not is_derivative_symbol(p[:-5])]
        log.debug(
            "Gate.io pair filtresi: %d → %d (-%d türev)",
            len(pairs),
            len(filtered),
            len(pairs) - len(filtered),
        )
        return filtered

    async def run(self):
        while True:
            try:
                await self._connect()
            except Exception as e:
                log.warning("Gate.io hata: %s — 5sn sonra yeniden.", e)
                await asyncio.sleep(5)

    async def _connect(self):
        pairs = await self._get_usdt_pairs()
        log.info("Gate.io: %d USDT pair.", len(pairs))

        chunk_size = 100
        sub_messages = []
        for i in range(0, len(pairs), chunk_size):
            chunk = pairs[i : i + chunk_size]
            sub_messages.append(
                {
                    "time": int(time.time()),
                    "channel": "spot.tickers",
                    "event": "subscribe",
                    "payload": chunk,
                }
            )

        async with websockets.connect(
            self.WS_URL, ping_interval=20, ping_timeout=30, max_size=10 * 1024 * 1024
        ) as ws:
            for sub in sub_messages:
                await ws.send(json.dumps(sub))
                await asyncio.sleep(0.1)
            log.info("Gate.io bağlandı.")
            async for raw in ws:
                await self._handle(raw)

    async def _handle(self, raw):
        try:
            msg = json.loads(raw)
        except Exception:
            return

        if msg.get("channel") != "spot.tickers" or msg.get("event") != "update":
            return

        result = msg.get("result", {})
        pair = result.get("currency_pair", "")
        if not pair.endswith("_USDT"):
            return
        symbol = pair[:-5]

        try:
            price = float(result.get("last", 0) or 0)
            volume = float(result.get("quote_volume", 0) or 0)
            change_24 = float(result.get("change_percentage", 0) or 0)
            high_24h = float(result.get("high_24h", 0) or 0)
            low_24h = float(result.get("low_24h", 0) or 0)
        except (ValueError, TypeError):
            return

        if price <= 0:
            return

        coin_id = self.coin_map.get(symbol) or self.coin_map.get(symbol + "USDT")
        if coin_id is None:
            coin_id = await ensure_coin(self.pool, self.coin_map, symbol)

        await redis_write(
            self.r,
            symbol,
            {
                "coin_id": coin_id,
                "price": price,
                "volume": volume,
                "change_24h": change_24,
                "high_24h": high_24h,
                "low_24h": low_24h,
                "market_cap": 0,
                "source": self.SOURCE,
                "ts": int(time.time() * 1000),
            },
        )


# ──────────────────────────────────────────────────────────────
# ② Bybit WebSocket
# ──────────────────────────────────────────────────────────────
class BybitWS:
    WS_URL = "wss://stream.bybit.com/v5/public/spot"
    REST_URL = "https://api.bybit.com/v5/market/tickers?category=spot"
    SOURCE = "bybit"

    def __init__(self, r, coin_map, pool):
        self.r = r
        self.coin_map = coin_map
        self.pool = pool

    async def _get_usdt_symbols(self):
        async with aiohttp.ClientSession() as s:
            async with s.get(
                self.REST_URL, timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
        items = data.get("result", {}).get("list", [])
        symbols = [d["symbol"] for d in items if d["symbol"].endswith("USDT")]
        # Kaldıraçlı ETF tokenlerini (BTC3L, ETH5S…) listeden çıkar.
        # Bybit formatı: "BTC3LUSDT" → base = symbol[:-4]
        filtered = [s for s in symbols if not is_derivative_symbol(s[:-4])]
        log.debug(
            "Bybit symbol filtresi: %d → %d (-%d türev)",
            len(symbols),
            len(filtered),
            len(symbols) - len(filtered),
        )
        return filtered

    async def run(self):
        while True:
            try:
                await self._connect()
            except Exception as e:
                log.warning("Bybit hata: %s — 5sn sonra yeniden.", e)
                await asyncio.sleep(5)

    async def _connect(self):
        symbols = await self._get_usdt_symbols()
        log.info("Bybit: %d USDT pair.", len(symbols))

        chunk_size = 10
        sub_messages = []
        for i in range(0, len(symbols), chunk_size):
            chunk = symbols[i : i + chunk_size]
            sub_messages.append(
                {"op": "subscribe", "args": [f"tickers.{s}" for s in chunk]}
            )

        async with websockets.connect(
            self.WS_URL, ping_interval=20, ping_timeout=30, max_size=10 * 1024 * 1024
        ) as ws:
            for sub in sub_messages:
                await ws.send(json.dumps(sub))
                await asyncio.sleep(0.05)

            async def pinger():
                while True:
                    await asyncio.sleep(20)
                    try:
                        await ws.send(json.dumps({"op": "ping"}))
                    except Exception:
                        break

            asyncio.create_task(pinger())

            log.info("Bybit bağlandı.")
            async for raw in ws:
                await self._handle(raw)

    async def _handle(self, raw):
        try:
            msg = json.loads(raw)
        except Exception:
            return

        if msg.get("op") == "pong" or "topic" not in msg:
            return

        topic = msg.get("topic", "")
        if not topic.startswith("tickers."):
            return

        symbol_full = topic.split(".", 1)[1]
        if not symbol_full.endswith("USDT"):
            return
        symbol = symbol_full[:-4]

        data = msg.get("data", {})
        try:
            price = float(data.get("lastPrice", 0) or 0)
            volume = float(data.get("turnover24h", 0) or 0)
            change_24 = float(data.get("price24hPcnt", 0) or 0) * 100
            high_24h = float(data.get("highPrice24h", 0) or 0)
            low_24h = float(data.get("lowPrice24h", 0) or 0)
        except (ValueError, TypeError):
            return

        if price <= 0:
            return

        coin_id = self.coin_map.get(symbol) or self.coin_map.get(symbol_full)
        if coin_id is None:
            coin_id = await ensure_coin(self.pool, self.coin_map, symbol)

        await redis_write(
            self.r,
            symbol,
            {
                "coin_id": coin_id,
                "price": price,
                "volume": volume,
                "change_24h": change_24,
                "high_24h": high_24h,
                "low_24h": low_24h,
                "market_cap": 0,
                "source": self.SOURCE,
                "ts": int(time.time() * 1000),
            },
        )


# ──────────────────────────────────────────────────────────────
# ③ OKX WebSocket
# ──────────────────────────────────────────────────────────────
class OkxWS:
    WS_URL = "wss://ws.okx.com:8443/ws/v5/public"
    REST_URL = "https://www.okx.com/api/v5/public/instruments?instType=SPOT"
    SOURCE = "okx"

    def __init__(self, r, coin_map, pool):
        self.r = r
        self.coin_map = coin_map
        self.pool = pool

    async def _get_usdt_instruments(self):
        async with aiohttp.ClientSession() as s:
            async with s.get(
                self.REST_URL, timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
        items = data.get("data", [])
        instruments = [d["instId"] for d in items if d["instId"].endswith("-USDT")]
        # Kaldıraçlı ETF tokenlerini (BTC3L-USDT, ETH5S-USDT…) listeden çıkar.
        # OKX formatı: "BTC3L-USDT" → base = instId[:-5]
        filtered = [i for i in instruments if not is_derivative_symbol(i[:-5])]
        log.debug(
            "OKX instrument filtresi: %d → %d (-%d türev)",
            len(instruments),
            len(filtered),
            len(instruments) - len(filtered),
        )
        return filtered

    async def run(self):
        while True:
            try:
                await self._connect()
            except Exception as e:
                log.warning("OKX hata: %s — 5sn sonra yeniden.", e)
                await asyncio.sleep(5)

    async def _connect(self):
        instruments = await self._get_usdt_instruments()
        log.info("OKX: %d USDT instrument.", len(instruments))

        chunk_size = 100
        sub_messages = []
        for i in range(0, len(instruments), chunk_size):
            chunk = instruments[i : i + chunk_size]
            sub_messages.append(
                {
                    "op": "subscribe",
                    "args": [{"channel": "tickers", "instId": inst} for inst in chunk],
                }
            )

        async with websockets.connect(
            self.WS_URL, ping_interval=25, ping_timeout=30, max_size=10 * 1024 * 1024
        ) as ws:
            for sub in sub_messages:
                await ws.send(json.dumps(sub))
                await asyncio.sleep(0.1)
            log.info("OKX bağlandı.")
            async for raw in ws:
                await self._handle(raw)

    async def _handle(self, raw):
        try:
            msg = json.loads(raw)
        except Exception:
            return

        if msg.get("event") in ("subscribe", "unsubscribe", "error"):
            return

        arg = msg.get("arg", {})
        data = msg.get("data", [])
        if arg.get("channel") != "tickers" or not data:
            return

        d = data[0]
        inst_id = d.get("instId", "")
        if not inst_id.endswith("-USDT"):
            return
        symbol = inst_id[:-5]

        try:
            price = float(d.get("last", 0) or 0)
            volume = float(d.get("volCcy24h", 0) or 0)
            open24h = float(d.get("open24h", 0) or 0)
            change_24 = (
                ((price - open24h) / open24h * 100) if open24h and price else 0.0
            )
            high_24h = float(d.get("high24h", 0) or 0)
            low_24h = float(d.get("low24h", 0) or 0)
        except (ValueError, TypeError):
            return

        if price <= 0:
            return

        coin_id = self.coin_map.get(symbol) or self.coin_map.get(symbol + "USDT")
        if coin_id is None:
            coin_id = await ensure_coin(self.pool, self.coin_map, symbol)

        await redis_write(
            self.r,
            symbol,
            {
                "coin_id": coin_id,
                "price": price,
                "volume": volume,
                "change_24h": change_24,
                "high_24h": high_24h,
                "low_24h": low_24h,
                "market_cap": 0,
                "source": self.SOURCE,
                "ts": int(time.time() * 1000),
            },
        )


# ──────────────────────────────────────────────────────────────
# ④ CoinGecko REST Poller (fallback)
# ──────────────────────────────────────────────────────────────
class CoinGeckoPoller:
    REST_URL = "https://api.coingecko.com/api/v3/coins/markets"
    SOURCE = "coingecko"
    INTERVAL = 600
    PAGE_SIZE = 250

    def __init__(self, r, coin_map, pool):
        self.r = r
        self.coin_map = coin_map
        self.pool = pool

    async def run(self):
        # İlk çalışmada hemen başlat, bekleme
        await asyncio.sleep(5)
        while True:
            try:
                await self._poll()
            except Exception as e:
                log.error("CoinGecko poll hatası: %s", e)
            await asyncio.sleep(self.INTERVAL)

    async def _poll(self):
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT slug FROM coins WHERE slug IS NOT NULL")
                rows = await cur.fetchall()
        slugs = [r[0] for r in rows if r[0]]
        if not slugs:
            return

        log.info("CoinGecko poll: %d coin.", len(slugs))
        updated = 0

        async with aiohttp.ClientSession() as session:
            for i in range(0, len(slugs), self.PAGE_SIZE):
                chunk = slugs[i : i + self.PAGE_SIZE]
                params = {
                    "vs_currency": "usd",
                    "ids": ",".join(chunk),
                    "per_page": self.PAGE_SIZE,
                    "page": 1,
                    "sparkline": "false",
                }
                try:
                    async with session.get(
                        self.REST_URL,
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=30),
                    ) as resp:
                        if resp.status == 429:
                            log.warning("CoinGecko rate limit — 60sn bekleniyor.")
                            await asyncio.sleep(60)
                            continue
                        data = await resp.json()
                except Exception as e:
                    log.error("CoinGecko istek hatası: %s", e)
                    await asyncio.sleep(10)
                    continue

                for item in data:
                    sym = (item.get("symbol") or "").upper()
                    price = item.get("current_price") or 0
                    volume = item.get("total_volume") or 0
                    ch24 = item.get("price_change_percentage_24h") or 0
                    mcap = item.get("market_cap") or 0
                    high_24h = item.get("high_24h") or 0
                    low_24h = item.get("low_24h") or 0

                    if not sym or price <= 0:
                        continue

                    coin_id = self.coin_map.get(sym) or self.coin_map.get(sym + "USDT")
                    if coin_id is None:
                        coin_id = await ensure_coin(self.pool, self.coin_map, sym)

                    await redis_write(
                        self.r,
                        sym,
                        {
                            "coin_id": coin_id,
                            "price": price,
                            "volume": volume,
                            "change_24h": ch24,
                            "high_24h": high_24h,
                            "low_24h": low_24h,
                            "market_cap": mcap,
                            "source": self.SOURCE,
                            "ts": int(time.time() * 1000),
                        },
                    )
                    updated += 1

                await asyncio.sleep(2)

        log.info("CoinGecko poll tamamlandı: %d coin.", updated)


# ──────────────────────────────────────────────────────────────
# Health Monitor
# ──────────────────────────────────────────────────────────────
async def health_monitor(r: aioredis.Redis) -> None:
    while True:
        await asyncio.sleep(60)
        try:
            count = await r.scard("tickers")
            log.info("📊 Aktif coin sayısı: %d", count)
        except Exception:
            pass


# ──────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────
async def main() -> None:
    log.info("Multi-Exchange Price Feed başlatılıyor…")

    r = aioredis.from_url(REDIS_URL, decode_responses=True)

    pool = await aiomysql.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
        autocommit=False,
        minsize=2,
        maxsize=10,
        init_command="SET time_zone = '+00:00'",
    )

    coin_map = await load_coin_map(pool)
    log.info("Coin haritası: %d kayıt.", len(coin_map))

    gate = GateWS(r, coin_map, pool)
    bybit = BybitWS(r, coin_map, pool)
    okx = OkxWS(r, coin_map, pool)
    cg = CoinGeckoPoller(r, coin_map, pool)

    await asyncio.gather(
        gate.run(),
        bybit.run(),
        okx.run(),
        cg.run(),
        snapshot_loop(r, pool),
        health_monitor(r),
    )


if __name__ == "__main__":
    asyncio.run(main())
