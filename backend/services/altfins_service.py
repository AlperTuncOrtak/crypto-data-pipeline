# ============================================================
# backend/services/altfins_service.py
# ============================================================
# Altfins signals-feed → zenginleştirilmiş parse
#
# Free plan kısıtları:
#   - Sadece signals-feed endpoint'i (POST)
#   - RSI/BB sayısal değerleri yok (paid plan)
#   - Ama sinyal isimleri çok bilgi taşıyor → bunları parse ediyoruz
#
# Değişiklikler:
#   - days_back=5, size=100 (daha fazla veri)
#   - Ağırlıklı sinyal skoru (yeni sinyal > eski)
#   - Sinyal çakışma tespiti (confluence)
#   - RSI seviyesini sinyal adından tahmin etme
# ============================================================

import os
import httpx
import logging
from datetime import datetime, timezone, timedelta

log = logging.getLogger("altfins_service")

ALTFINS_BASE = "https://altfins.com/api/v2/public"
ALTFINS_KEY = os.getenv("ALTFINS_API_KEY", "")

HEADERS = {
    "X-API-KEY": ALTFINS_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

TIMEOUT = 15.0

# ── Signal key kategorileri ───────────────────────────────────
RSI_KEYS = ("RSI", "MOMENTUM_RSI")
MACD_KEYS = ("MACD", "FRESH_MOMENTUM", "MOMENTUM_UP_DOWN", "MOMENTUM_RSI")
BB_KEYS = ("BOLLBAND", "BOLL_BAND", "BOLLINGER")
STOCH_KEYS = ("STOCH",)
EMA_KEYS = ("EMA", "TREND_EMA", "MA_")


async def get_signals(symbol: str, days_back: int = 5) -> list:
    """
    Son N günün sinyallerini çeker.
    days_back=5 + size=100 → daha güvenilir yön hesabı.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                f"{ALTFINS_BASE}/signals-feed/search-requests",
                json={
                    "symbols": [symbol.upper()],
                    "page": 0,
                    "size": 100,  # 50 → 100
                    "from": since,
                },
                headers=HEADERS,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("content") or []
    except Exception as e:
        log.error(f"Altfins signals error ({symbol}): {e}")
        return []


async def get_full_analysis(symbol: str) -> dict:
    signals = await get_signals(symbol, days_back=5)
    return {
        "symbol": symbol.upper(),
        "signals": signals,
        "ta": None,
        "screener": None,
    }


# ── Ağırlıklı sinyal skoru ────────────────────────────────────
def _signal_weight(signal: dict) -> float:
    """
    Yeni sinyaller daha ağırlıklı.
    Son 24 saat → 1.5x, son 48 saat → 1.2x, daha eski → 1.0x
    """
    try:
        ts_str = signal.get("timestamp") or signal.get("createdAt") or ""
        if not ts_str:
            return 1.0
        # ISO format: 2024-01-15T10:30:00Z
        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        age_hours = (datetime.now(timezone.utc) - ts).total_seconds() / 3600
        if age_hours < 24:
            return 1.5
        if age_hours < 48:
            return 1.2
        return 1.0
    except Exception:
        return 1.0


# ── Signal parse ──────────────────────────────────────────────
def parse_signal(signals: list) -> dict:
    if not signals:
        return {"signal": "neutral", "confidence": 50}

    bull_score = 0.0
    bear_score = 0.0

    for s in signals:
        w = _signal_weight(s)
        if s.get("direction") == "BULLISH":
            bull_score += w
        elif s.get("direction") == "BEARISH":
            bear_score += w

    total = bull_score + bear_score
    if total == 0:
        return {"signal": "neutral", "confidence": 50}

    bull_pct = bull_score / total * 100
    bear_pct = bear_score / total * 100

    if bull_pct >= 65:
        return {"signal": "bullish", "confidence": int(min(bull_pct, 95))}
    if bear_pct >= 65:
        return {"signal": "bearish", "confidence": int(min(bear_pct, 95))}
    return {"signal": "hold", "confidence": int(max(bull_pct, bear_pct, 45))}


# ── Sinyal adından RSI tahmini ────────────────────────────────
def _estimate_rsi_level(signal_name: str) -> str | None:
    """
    Sinyal isimlerinden RSI bölgesini tahmin et.
    Örn: "RSI Oversold" → "oversold", "RSI Overbought" → "overbought"
    """
    name = (signal_name or "").lower()
    if "oversold" in name or "below 30" in name:
        return "oversold"
    if "overbought" in name or "above 70" in name:
        return "overbought"
    if "bullish" in name or "cross" in name:
        return "bullish"
    if "bearish" in name:
        return "bearish"
    return "neutral"


# ── Confluence (sinyal çakışması) tespiti ────────────────────
def detect_confluence(ta: dict) -> dict:
    """
    Birden fazla indikatör aynı yönü gösteriyorsa güç puanı hesapla.
    0-4 arası: kaç indikatör aynı yönde.
    """
    bullish_count = sum(
        [
            1 if ta.get("rsi_signal") in ("bullish", "oversold") else 0,
            1 if ta.get("macd_trend") == "bullish" else 0,
            1 if ta.get("bb_signal") in ("near_lower",) else 0,
            1 if ta.get("stoch_signal") == "oversold" else 0,
            1 if ta.get("ema_trend") == "bullish" else 0,
        ]
    )
    bearish_count = sum(
        [
            1 if ta.get("rsi_signal") in ("bearish", "overbought") else 0,
            1 if ta.get("macd_trend") == "bearish" else 0,
            1 if ta.get("bb_signal") in ("near_upper",) else 0,
            1 if ta.get("stoch_signal") == "overbought" else 0,
            1 if ta.get("ema_trend") == "bearish" else 0,
        ]
    )

    dominant = (
        "bullish"
        if bullish_count > bearish_count
        else ("bearish" if bearish_count > bullish_count else "neutral")
    )

    return {
        "bullish_indicators": bullish_count,
        "bearish_indicators": bearish_count,
        "dominant": dominant,
        "strength": max(bullish_count, bearish_count),  # 0-5
        "conflicting": bullish_count > 0 and bearish_count > 0,
    }


# ── TA parse — sinyallerden indikatör yorumu çıkar ───────────
def parse_ta(ta: dict, signals: list = None) -> dict:
    """
    signals-feed'den RSI, MACD, BB, Stochastic, EMA bilgisi çıkarır.
    Sinyal isimlerini de parse ederek daha zengin bilgi üretir.
    """
    if not signals:
        return {}

    def find(keys, direction=None):
        for s in signals:
            key = s.get("signalKey", "")
            if any(k in key for k in keys):
                if direction is None or s.get("direction") == direction:
                    return s
        return None

    def find_all(keys, direction=None):
        results = []
        for s in signals:
            key = s.get("signalKey", "")
            if any(k in key for k in keys):
                if direction is None or s.get("direction") == direction:
                    results.append(s)
        return results

    # RSI
    rsi_bull = find(RSI_KEYS, "BULLISH")
    rsi_bear = find(RSI_KEYS, "BEARISH")
    rsi_sig = find(RSI_KEYS)
    rsi_signal = None
    rsi_detail = None
    if rsi_bull:
        rsi_signal = _estimate_rsi_level(rsi_bull.get("signalName", ""))
        rsi_detail = rsi_bull.get("signalName")
    elif rsi_bear:
        rsi_signal = _estimate_rsi_level(rsi_bear.get("signalName", ""))
        rsi_detail = rsi_bear.get("signalName")
    elif rsi_sig:
        rsi_detail = rsi_sig.get("signalName")

    # MACD
    macd_bull = find(MACD_KEYS, "BULLISH")
    macd_bear = find(MACD_KEYS, "BEARISH")
    macd_trend = "bullish" if macd_bull else "bearish" if macd_bear else None
    macd_detail = (
        macd_bull.get("signalName")
        if macd_bull
        else (macd_bear.get("signalName") if macd_bear else None)
    )

    # Bollinger Bands
    bb_bull = find(BB_KEYS, "BULLISH")
    bb_bear = find(BB_KEYS, "BEARISH")
    bb_signal = None
    if bb_bull:
        name = bb_bull.get("signalName", "").lower()
        bb_signal = (
            "near_upper"
            if "upper" in name
            else "near_lower" if "lower" in name else "middle"
        )
    elif bb_bear:
        name = bb_bear.get("signalName", "").lower()
        bb_signal = (
            "near_upper"
            if "upper" in name
            else "near_lower" if "lower" in name else "near_upper"
        )
    bb_detail = (
        bb_bull.get("signalName")
        if bb_bull
        else (bb_bear.get("signalName") if bb_bear else None)
    )

    # Stochastic
    stoch_bull = find(STOCH_KEYS, "BULLISH")
    stoch_bear = find(STOCH_KEYS, "BEARISH")
    stoch_signal = None
    if stoch_bull:
        stoch_signal = "oversold"
    elif stoch_bear:
        stoch_signal = "overbought"
    stoch_detail = (
        stoch_bull.get("signalName")
        if stoch_bull
        else (stoch_bear.get("signalName") if stoch_bear else None)
    )

    # EMA
    ema_bull = find(EMA_KEYS, "BULLISH")
    ema_bear = find(EMA_KEYS, "BEARISH")
    ema_trend = "bullish" if ema_bull else "bearish" if ema_bear else None

    # Sinyal detayları (son 15 sinyal, ağırlığa göre sıralı)
    sorted_signals = sorted(signals, key=_signal_weight, reverse=True)
    signal_details = []
    for s in sorted_signals[:15]:
        signal_details.append(
            {
                "direction": s.get("direction"),
                "name": s.get("signalName"),
                "key": s.get("signalKey"),
                "time": s.get("timestamp"),
                "weight": _signal_weight(s),
            }
        )

    # Confluence analizi için geçici ta dict
    temp_ta = {
        "rsi_signal": rsi_signal,
        "macd_trend": macd_trend,
        "bb_signal": bb_signal,
        "stoch_signal": stoch_signal,
        "ema_trend": ema_trend,
    }
    confluence = detect_confluence(temp_ta)

    return {
        "rsi": None,  # sayısal değer paid plan'da
        "rsi_signal": rsi_signal,
        "rsi_detail": rsi_detail,
        "macd_trend": macd_trend,
        "macd_detail": macd_detail,
        "bb_position": None,  # sayısal değer paid plan'da
        "bb_signal": bb_signal,
        "bb_detail": bb_detail,
        "stoch_signal": stoch_signal,
        "stoch_detail": stoch_detail,
        "ema_trend": ema_trend,
        "signal_details": signal_details,
        "data_source": "altfins",
        "data_points": len(signals),
        "confluence": confluence,
    }
