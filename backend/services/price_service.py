import asyncio
import logging
from typing import Dict, List

from pymysql.cursors import DictCursor

from shared.db import get_connection
from backend.services.redis_service import get_all_tickers

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Bu modul eskiden fiyatlari CoinCap'ten (api.coincap.io) cekiyordu.
# O host artik DNS'te bile cozulmuyor; production loglari
# "Error fetching live prices from CoinCap: [Errno -2] Name or service
# not known" ile doluydu ve fonksiyon sessizce bos dict donuyordu.
#
# Artik projenin kendi fiyat pipeline'ini kullaniyoruz: once Redis'teki
# canli ticker'lar, eksik kalan semboller icin MySQL'deki latest_prices.
# Ayni veri /market endpoint'ini besliyor, yani ekranda gorunen fiyatla
# burada hesaplanan fiyat artik ayni kaynaktan geliyor.
#
# Eskiden ETH bulunamazsa prices["ETH"] = 3000.0 yaziliyordu. Bu uydurma
# bir fiyatti ve cagiran taraf bunu gercek zannediyordu; kaldirildi.
# Bulunamayan sembol artik sonuca hic girmiyor.
# ------------------------------------------------------------------


def _prices_from_redis(symbols_upper: set[str]) -> Dict[str, float]:
    """Redis'teki canli ticker'lardan istenen sembolleri topla."""
    prices: Dict[str, float] = {}
    try:
        for ticker in get_all_tickers(limit=5000) or []:
            sym = str(ticker.get("symbol", "")).upper()
            if sym in symbols_upper:
                price = float(ticker.get("current_price") or 0)
                if price > 0:
                    prices[sym] = price
    except Exception as e:
        logger.warning(f"Redis price lookup failed, falling back to DB: {e}")
    return prices


def _prices_from_db(symbols_upper: set[str]) -> Dict[str, float]:
    """latest_prices tablosundan fiyat cek (Redis'te olmayan semboller icin)."""
    if not symbols_upper:
        return {}

    prices: Dict[str, float] = {}
    placeholders = ",".join(["%s"] * len(symbols_upper))
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        try:
            cursor.execute(
                f"""
                SELECT c.symbol, lp.current_price
                FROM latest_prices lp
                JOIN coins c ON lp.coin_id = c.id
                WHERE c.symbol IN ({placeholders}) AND lp.current_price > 0
                """,
                tuple(symbols_upper),
            )
            for row in cursor.fetchall():
                sym = str(row["symbol"]).upper()
                # Ayni sembol birden fazla coin kaydinda olabilir; ilkini tut.
                if sym not in prices:
                    prices[sym] = float(row["current_price"])
        finally:
            cursor.close()
    finally:
        conn.close()

    return prices


def get_live_prices_sync(symbols: List[str]) -> Dict[str, float]:
    """
    Verilen sembollerin USD fiyatlarini doner.

    Bulunamayan semboller sonuc dict'inde yer almaz — cagiran taraf
    eksik fiyati kendi ele almali (uydurma bir deger donmuyoruz).
    """
    if not symbols:
        return {}

    symbols_upper = {s.upper() for s in symbols if s}
    if not symbols_upper:
        return {}

    prices = _prices_from_redis(symbols_upper)

    missing = symbols_upper - prices.keys()
    if missing:
        try:
            prices.update(_prices_from_db(missing))
        except Exception as e:
            logger.error(f"DB price lookup failed for {sorted(missing)}: {e}")

    still_missing = symbols_upper - prices.keys()
    if still_missing:
        logger.info(f"No price available for: {sorted(still_missing)}")

    return prices


async def get_live_prices_async(symbols: List[str]) -> Dict[str, float]:
    """
    get_live_prices_sync'in async sarmalayicisi.

    Redis ve MySQL cagrilari senkron; event loop'u bloklamamak icin
    ayri bir thread'de calistiriyoruz.
    """
    if not symbols:
        return {}
    return await asyncio.to_thread(get_live_prices_sync, symbols)
