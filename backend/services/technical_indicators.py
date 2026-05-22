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

        # 30 günlük veri çek (MACD için min 26, güvenli olsun 30d)
        history = get_coin_history(slug, range_key="30d")
        if not history or len(history) < 30:
            log.warning(f"Not enough price history for {slug}: {len(history) if history else 0} points")
            return altfins_ta or {}

        # DataFrame oluştur
        df = pd.DataFrame(history)
        df["close"] = pd.to_numeric(df["price"], errors="coerce")
        df = df.dropna(subset=["close"]).reset_index(drop=True)

        if len(df) < 30:
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
    import pandas_ta as ta

    close = df["close"]
    result = {}

    # ── RSI (14) ─────────────────────────────────────────────
    try:
        rsi_series = ta.rsi(close, length=14)
        rsi_val = float(rsi_series.iloc[-1]) if rsi_series is not None and not rsi_series.empty else None
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
        macd_df = ta.macd(close, fast=12, slow=26, signal=9)
        if macd_df is not None and not macd_df.empty:
            # pandas-ta returns: MACD_12_26_9, MACDh_12_26_9, MACDs_12_26_9
            macd_col = [c for c in macd_df.columns if c.startswith("MACD_")][0]
            hist_col = [c for c in macd_df.columns if c.startswith("MACDh_")][0]
            sig_col  = [c for c in macd_df.columns if c.startswith("MACDs_")][0]

            macd_val = float(macd_df[macd_col].iloc[-1])
            hist_val = float(macd_df[hist_col].iloc[-1])
            sig_val  = float(macd_df[sig_col].iloc[-1])

            # Trend: histogram yönü + crossover
            prev_hist = float(macd_df[hist_col].iloc[-2]) if len(macd_df) > 1 else hist_val
            hist_rising = hist_val > prev_hist

            result["macd_value"]     = round(macd_val, 2)
            result["macd_histogram"] = round(hist_val, 2)
            result["macd_signal"]    = round(sig_val, 2)
            result["macd_trend"]     = "bullish" if hist_val > 0 else "bearish"
            result["macd_momentum"]  = "increasing" if hist_rising else "decreasing"

            # Crossover tespiti (son 3 mum)
            if len(macd_df) >= 3:
                h_prev2 = float(macd_df[hist_col].iloc[-3])
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
        bb_df = ta.bbands(close, length=20, std=2)
        if bb_df is not None and not bb_df.empty:
            upper_col = [c for c in bb_df.columns if "BBU" in c][0]
            lower_col = [c for c in bb_df.columns if "BBL" in c][0]
            mid_col   = [c for c in bb_df.columns if "BBM" in c][0]
            bw_col    = [c for c in bb_df.columns if "BBB" in c][0]  # bandwidth

            upper = float(bb_df[upper_col].iloc[-1])
            lower = float(bb_df[lower_col].iloc[-1])
            mid   = float(bb_df[mid_col].iloc[-1])
            bw    = float(bb_df[bw_col].iloc[-1]) if bw_col else None
            price = float(close.iloc[-1])

            # %B pozisyonu (0=lower band, 1=upper band)
            band_range = upper - lower
            if band_range > 0:
                pct_b = (price - lower) / band_range
            else:
                pct_b = 0.5

            result["bb_upper"]    = round(upper, 2)
            result["bb_lower"]    = round(lower, 2)
            result["bb_middle"]   = round(mid, 2)
            result["bb_pct_b"]    = round(pct_b, 3)
            result["bb_position"] = round(pct_b, 3)  # frontend için
            result["bb_width"]    = round(bw, 4) if bw else None

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
        # pandas-ta stoch needs high/low — approximate with close
        # Use a rolling high/low window from close prices
        high  = close.rolling(window=3).max()
        low   = close.rolling(window=3).min()
        stoch_df = ta.stoch(high=high, low=low, close=close, k=14, d=3)
        if stoch_df is not None and not stoch_df.empty:
            k_col = [c for c in stoch_df.columns if "STOCHk" in c][0]
            d_col = [c for c in stoch_df.columns if "STOCHd" in c][0]
            k_val = float(stoch_df[k_col].iloc[-1])
            d_val = float(stoch_df[d_col].iloc[-1])

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
        ema20 = ta.ema(close, length=20)
        ema50 = ta.ema(close, length=50)

        if ema20 is not None and ema50 is not None:
            ema20_val = float(ema20.iloc[-1])
            ema50_val = float(ema50.iloc[-1])
            price_val = float(close.iloc[-1])

            result["ema20"] = round(ema20_val, 2)
            result["ema50"] = round(ema50_val, 2)

            # Crossover yönü
            if ema20_val > ema50_val:
                result["ema_trend"] = "bullish"
                result["ema_detail"] = f"EMA20 ({ema20_val:,.0f}) > EMA50 ({ema50_val:,.0f}) — uptrend"
            else:
                result["ema_trend"] = "bearish"
                result["ema_detail"] = f"EMA20 ({ema20_val:,.0f}) < EMA50 ({ema50_val:,.0f}) — downtrend"

            # Fiyat vs EMA20
            if price_val > ema20_val:
                result["price_vs_ema20"] = "above"
            else:
                result["price_vs_ema20"] = "below"
    except Exception as e:
        log.warning(f"EMA calculation failed: {e}")

    # ── Destek / Direnç (7 günlük high/low) ──────────────────
    try:
        recent = close.tail(int(len(close) * 7 / 30))  # son 7 günün verisi
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
