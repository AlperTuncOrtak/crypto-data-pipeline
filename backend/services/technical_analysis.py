# ============================================================
# technical_analysis.py
# ============================================================
# Fiyat geçmişinden teknik indikatörler hesaplar:
#  - RSI (14)
#  - MACD (12, 26, 9)
#  - Bollinger Bands (20)
#  - EMA 20, EMA 50
#  - Volume SMA
# ============================================================

import pandas as pd
import ta
from shared.db import get_connection
from pymysql.cursors import DictCursor


def get_price_history_df(coin_id: int, limit: int = 200) -> pd.DataFrame:
    """DB'den fiyat geçmişini DataFrame olarak çeker."""
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT current_price, collected_at
        FROM price_history
        WHERE coin_id = %s
        ORDER BY collected_at DESC
        LIMIT %s
    """, (coin_id, limit))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.sort_values('collected_at').reset_index(drop=True)
    df['current_price'] = df['current_price'].astype(float)
    return df


def calculate_indicators(df: pd.DataFrame) -> dict:
    """DataFrame üzerinden teknik indikatörleri hesaplar."""
    if df.empty or len(df) < 20:
        return {"error": "Not enough data points"}

    close = df['current_price']

    result = {}

    # RSI (14)
    try:
        rsi = ta.momentum.RSIIndicator(close=close, window=14)
        result['rsi'] = round(float(rsi.rsi().iloc[-1]), 2)
        result['rsi_signal'] = (
            'overbought' if result['rsi'] > 70
            else 'oversold' if result['rsi'] < 30
            else 'neutral'
        )
    except Exception:
        result['rsi'] = None

    # MACD (12, 26, 9)
    try:
        macd = ta.trend.MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        result['macd'] = round(float(macd.macd().iloc[-1]), 6)
        result['macd_signal'] = round(float(macd.macd_signal().iloc[-1]), 6)
        result['macd_diff'] = round(float(macd.macd_diff().iloc[-1]), 6)
        result['macd_trend'] = 'bullish' if result['macd_diff'] > 0 else 'bearish'
    except Exception:
        result['macd'] = None

    # Bollinger Bands (20)
    try:
        bb = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
        result['bb_upper'] = round(float(bb.bollinger_hband().iloc[-1]), 6)
        result['bb_lower'] = round(float(bb.bollinger_lband().iloc[-1]), 6)
        result['bb_middle'] = round(float(bb.bollinger_mavg().iloc[-1]), 6)
        current = float(close.iloc[-1])
        bb_width = result['bb_upper'] - result['bb_lower']
        result['bb_position'] = round((current - result['bb_lower']) / bb_width, 3) if bb_width > 0 else 0.5
        result['bb_signal'] = (
            'near_upper' if result['bb_position'] > 0.8
            else 'near_lower' if result['bb_position'] < 0.2
            else 'middle'
        )
    except Exception:
        result['bb_upper'] = None

    # EMA 20 ve EMA 50
    try:
        ema20 = ta.trend.EMAIndicator(close=close, window=20)
        result['ema20'] = round(float(ema20.ema_indicator().iloc[-1]), 6)

        if len(df) >= 50:
            ema50 = ta.trend.EMAIndicator(close=close, window=50)
            result['ema50'] = round(float(ema50.ema_indicator().iloc[-1]), 6)
            result['ema_trend'] = 'bullish' if result['ema20'] > result['ema50'] else 'bearish'
        else:
            result['ema50'] = None
            result['ema_trend'] = 'insufficient_data'
    except Exception:
        result['ema20'] = None

    # Fiyat özeti
    result['current_price'] = round(float(close.iloc[-1]), 8)
    result['price_24h_ago'] = round(float(close.iloc[0]), 8) if len(close) > 0 else None
    result['price_change_pct'] = round(
        ((result['current_price'] - result['price_24h_ago']) / result['price_24h_ago']) * 100, 2
    ) if result['price_24h_ago'] else None
    result['highest'] = round(float(close.max()), 8)
    result['lowest'] = round(float(close.min()), 8)
    result['data_points'] = len(df)

    return result


def get_technical_analysis(slug: str) -> dict:
    """Slug'a göre coin'i bulur ve teknik analiz yapar."""
    conn = get_connection()
    cursor = conn.cursor(DictCursor)
    cursor.execute("""
        SELECT c.id, c.name, c.symbol, lp.current_price, lp.price_change_percentage_24h, lp.total_volume
        FROM coins c
        LEFT JOIN latest_prices lp ON lp.coin_id = c.id
        WHERE c.slug = %s
    """, (slug,))
    coin = cursor.fetchone()
    cursor.close()
    conn.close()

    if not coin:
        return {"error": f"Coin not found: {slug}"}

    df = get_price_history_df(coin['id'], limit=200)
    indicators = calculate_indicators(df)

    return {
        "coin": {
            "name": coin['name'],
            "symbol": coin['symbol'],
            "current_price": float(coin['current_price'] or 0),
            "change_24h": float(coin['price_change_percentage_24h'] or 0),
            "volume_24h": float(coin['total_volume'] or 0),
        },
        "indicators": indicators,
    }