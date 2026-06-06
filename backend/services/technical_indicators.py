# ============================================================
# backend/services/technical_indicators.py
# ============================================================
# Calculates real indicator values from price_history DB
# using pandas-ta. Combines with Altfins signal directions.
#
# Returns exact numbers for the prompt:
#   RSI: 68.4 (overbought, confirmed by Altfins)
#   MACD: histogram -120, bearish
#   BB: price at 78% of band width (near upper)
#   Stoch: K=82.3, D=79.1 (overbought)
#   EMA20: 79,200 | EMA50: 76,800 (bullish crossover)
# ============================================================

import logging
import pandas as pd

log = logging.getLogger("technical_indicators")


def calculate_indicators(slug: str, altfins_ta: dict = None) -> dict:
    """
    Main function. Fetches price history, calculates indicators,
    merges with Altfins signal directions.

    Args:
        slug: coin slug (e.g. 'bitcoin')
        altfins_ta: existing ta dict from parse_ta() — for signal direction merge

    Returns:
        Enriched ta dict with real numeric values
    """
    try:
        from backend.services.coin_service import get_coin_history

        # Kullanicinin talebi uzerine disaridan veri (CoinGecko) cekilmiyor.
        # Sadece kendi veritabanindaki (price_history) TUM veri kullaniliyor.
        history = get_coin_history(slug, range_key="all")

        if not history or len(history) < 15:
            log.warning(f"Not enough price history for {slug}: {len(history) if history else 0} points")
            return altfins_ta or {}

        # DataFrame oluştur
        df = pd.DataFrame(history)
        df["close"] = pd.to_numeric(df["price"], errors="coerce")
        df = df.dropna(subset=["close"]).reset_index(drop=True)

        if len(df) < 15:
            log.warning(f"Insufficient clean data for {slug}")
            return altfins_ta or {}

        # pandas-ta hesaplamaları
        indicators = _calculate_all(df)

        # Altfins sinyalleriyle birleştir
        if altfins_ta:
            indicators = _merge_with_altfins(indicators, altfins_ta)

        return indicators

    except Exception as e:
        log.error(f"Technical indicators calculation failed for {slug}: {e}")
        return altfins_ta or {}


def _calculate_all(df: pd.DataFrame) -> dict:
    """
    Tüm indikatörleri hesapla, son değerleri döndür.
    """
    import ta
    import math

    close = df["close"]
    result = {}

    def safe_float(val):
        try:
            f = float(val)
            return None if math.isnan(f) else f
        except:
            return None

    # ── RSI (14) ─────────────────────────────────────────────
    try:
        rsi_indicator = ta.momentum.RSIIndicator(close=close, window=14)
        rsi_val = safe_float(rsi_indicator.rsi().iloc[-1])
        if rsi_val is not None:
            result["rsi"] = round(rsi_val, 1)
            if rsi_val >= 70:
                result["rsi_signal"] = "overbought"
                result["rsi_zone"] = "overbought (>70)"
            elif rsi_val <= 30:
                result["rsi_signal"] = "oversold"
                result["rsi_zone"] = "oversold (<30)"
            elif rsi_val >= 55:
                result["rsi_signal"] = "bullish"
                result["rsi_zone"] = "bullish zone (55-70)"
            elif rsi_val <= 45:
                result["rsi_signal"] = "bearish"
                result["rsi_zone"] = "bearish zone (30-45)"
            else:
                result["rsi_signal"] = "neutral"
                result["rsi_zone"] = "neutral (45-55)"
    except Exception as e:
        log.warning(f"RSI calculation failed: {e}")

    # ── MACD (12, 26, 9) ─────────────────────────────────────
    try:
        macd_indicator = ta.trend.MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        macd_val = safe_float(macd_indicator.macd().iloc[-1])
        hist_val = safe_float(macd_indicator.macd_diff().iloc[-1])
        sig_val  = safe_float(macd_indicator.macd_signal().iloc[-1])

        if macd_val is not None and hist_val is not None and sig_val is not None:
            prev_hist = safe_float(macd_indicator.macd_diff().iloc[-2]) if len(close) > 1 else hist_val
            hist_rising = hist_val > (prev_hist or hist_val)

            result["macd_value"]     = round(macd_val, 2)
            result["macd_histogram"] = round(hist_val, 2)
            result["macd_signal"]    = round(sig_val, 2)
            result["macd_trend"]     = "bullish" if hist_val > 0 else "bearish"
            result["macd_momentum"]  = "increasing" if hist_rising else "decreasing"

            if len(close) >= 3:
                h_prev2 = safe_float(macd_indicator.macd_diff().iloc[-3])
                if h_prev2 is not None:
                    if h_prev2 < 0 and hist_val > 0:
                        result["macd_crossover"] = "bullish_crossover"
                    elif h_prev2 > 0 and hist_val < 0:
                        result["macd_crossover"] = "bearish_crossover"
                    else:
                        result["macd_crossover"] = None
    except Exception as e:
        log.warning(f"MACD calculation failed: {e}")

    # ── Bollinger Bands (20, 2) ───────────────────────────────
    try:
        bb = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
        upper = safe_float(bb.bollinger_hband().iloc[-1])
        lower = safe_float(bb.bollinger_lband().iloc[-1])
        mid   = safe_float(bb.bollinger_mavg().iloc[-1])
        price = safe_float(close.iloc[-1])

        if upper is not None and lower is not None and mid is not None and price is not None:
            bw = (upper - lower) / mid if mid > 0 else None
            band_range = upper - lower
            if band_range > 0:
                pct_b = (price - lower) / band_range
            else:
                pct_b = 0.5

            result["bb_upper"]    = round(upper, 2)
            result["bb_lower"]    = round(lower, 2)
            result["bb_middle"]   = round(mid, 2)
            result["bb_pct_b"]    = round(pct_b, 3)
            result["bb_position"] = round(pct_b, 3)
            result["bb_width"]    = round(bw, 4) if bw is not None else None

            if pct_b >= 0.85:
                result["bb_signal"] = "near_upper"
                result["bb_zone"]   = f"near upper band ({pct_b:.0%})"
            elif pct_b <= 0.15:
                result["bb_signal"] = "near_lower"
                result["bb_zone"]   = f"near lower band ({pct_b:.0%})"
            elif pct_b >= 0.5:
                result["bb_signal"] = "middle"
                result["bb_zone"]   = f"above middle band ({pct_b:.0%})"
            else:
                result["bb_signal"] = "middle"
                result["bb_zone"]   = f"below middle band ({pct_b:.0%})"
    except Exception as e:
        log.warning(f"BB calculation failed: {e}")

    # ── Stochastic (14, 3) ────────────────────────────────────
    try:
        high  = close.rolling(window=3).max().fillna(close)
        low   = close.rolling(window=3).min().fillna(close)
        stoch = ta.momentum.StochasticOscillator(high=high, low=low, close=close, window=14, smooth_window=3)
        k_val = safe_float(stoch.stoch().iloc[-1])
        d_val = safe_float(stoch.stoch_signal().iloc[-1])

        if k_val is not None and d_val is not None:
            result["stoch_k"] = round(k_val, 1)
            result["stoch_d"] = round(d_val, 1)

            if k_val >= 80:
                result["stoch_signal"] = "overbought"
                result["stoch_zone"]   = f"overbought (K={k_val:.0f}, D={d_val:.0f})"
            elif k_val <= 20:
                result["stoch_signal"] = "oversold"
                result["stoch_zone"]   = f"oversold (K={k_val:.0f}, D={d_val:.0f})"
            elif k_val > d_val:
                result["stoch_signal"] = "bullish"
                result["stoch_zone"]   = f"bullish K>D (K={k_val:.0f}, D={d_val:.0f})"
            else:
                result["stoch_signal"] = "bearish"
                result["stoch_zone"]   = f"bearish K<D (K={k_val:.0f}, D={d_val:.0f})"
    except Exception as e:
        log.warning(f"Stochastic calculation failed: {e}")

    # ── EMA (20, 50) ──────────────────────────────────────────
    try:
        ema20_indicator = ta.trend.EMAIndicator(close=close, window=20)
        ema20_val = safe_float(ema20_indicator.ema_indicator().iloc[-1])
        price_val = safe_float(close.iloc[-1])

        if ema20_val is not None:
            result["ema20"] = round(ema20_val, 2)
            if price_val is not None:
                result["price_vs_ema20"] = "above" if price_val > ema20_val else "below"

            # Yeterli veri varsa EMA50 de hesapla
            if len(close) >= 50:
                ema50_indicator = ta.trend.EMAIndicator(close=close, window=50)
                ema50_val = safe_float(ema50_indicator.ema_indicator().iloc[-1])
                
                if ema50_val is not None:
                    result["ema50"] = round(ema50_val, 2)
                    if ema20_val > ema50_val:
                        result["ema_trend"] = "bullish"
                        result["ema_detail"] = f"EMA20 ({ema20_val:,.0f}) > EMA50 ({ema50_val:,.0f}) — uptrend"
                    else:
                        result["ema_trend"] = "bearish"
                        result["ema_detail"] = f"EMA20 ({ema20_val:,.0f}) < EMA50 ({ema50_val:,.0f}) — downtrend"
    except Exception as e:
        log.warning(f"EMA calculation failed: {e}")

    # ── Destek / Direnç ──────────────────────────────────────
    try:
        n = max(3, int(len(close) * 0.25))
        recent = close.tail(n)
        result["support_level"]    = round(float(recent.min()), 2)
        result["resistance_level"] = round(float(recent.max()), 2)
    except Exception as e:
        log.warning(f"S/R calculation failed: {e}")

    result["data_source"]    = "pandas-ta"
    result["data_points"]    = len(df)
    result["calculated"]     = True

    return result


def _merge_with_altfins(calculated: dict, altfins: dict) -> dict:
    """
    pandas-ta sayısal değerleri + Altfins sinyal yönleri birleştir.
    Altfins sinyal isimleri (detail) korunur, sayısal değerler eklenir.
    """
    merged = {**altfins, **calculated}

    # Altfins detail metinlerini koru (sinyal adları değerli)
    for field in ("rsi_detail", "macd_detail", "bb_detail", "stoch_detail"):
        if altfins.get(field):
            merged[field] = altfins[field]

    # Confluence'ı yeniden hesapla (artık gerçek sayılarla)
    from backend.services.altfins_service import detect_confluence
    merged["confluence"] = detect_confluence(merged)

    return merged
