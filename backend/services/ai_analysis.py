# ============================================================
# backend/services/ai_analysis.py
# ============================================================
# Altfins signals + market context → AI commentary
#
# Model chain:
#   1. Groq (Llama 3.3 70B) — free, fast, JSON mode
#   2. Gemini 2.0 Flash      — fallback
#   3. Static fallback        — if both fail
#
# Extra context injected into prompt:
#   - Fear & Greed Index (Alternative.me, free, no key)
#   - 7-day price trend + direction (CoinGecko via get_coin_history)
#   - Volume anomaly detection (24h volume vs market cap ratio)
#   - Full indicator-by-indicator breakdown
#   - Position-focused: stop-loss / take-profit front and center
# ============================================================

import os
import json
import asyncio
import logging
import httpx
from pathlib import Path
from dotenv import load_dotenv

from backend.services.coin_service import get_coin_by_slug, get_coin_history
from backend.services.altfins_service import (
    get_full_analysis,
    parse_signal,
    parse_ta,
)

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
log = logging.getLogger("ai_analysis")

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_KEY = os.getenv("GROQ_API_KEY", "")


# ══════════════════════════════════════════════════════════════
# MARKET CONTEXT FETCHERS
# ══════════════════════════════════════════════════════════════


def _fetch_fear_and_greed() -> dict:
    """
    Alternative.me Fear & Greed Index — free, no API key needed.
    Returns: {"value": 72, "label": "Greed"}
    """
    try:
        resp = httpx.get(
            "https://api.alternative.me/fng/?limit=1",
            timeout=5.0,
        )
        resp.raise_for_status()
        data = resp.json()["data"][0]
        return {
            "value": int(data["value"]),
            "label": data["value_classification"],
        }
    except Exception as e:
        log.warning(f"Fear & Greed fetch failed: {e}")
        return {"value": None, "label": "Unknown"}


def _fetch_price_trend(slug: str) -> dict:
    """
    7-day price trend using existing get_coin_history.
    Returns direction, 7d change %, momentum.
    """
    try:
        history = get_coin_history(slug, range_key="7d")
        if not history or len(history) < 2:
            return {
                "change_7d": None,
                "direction": "unknown",
                "description": "Insufficient data",
            }

        prices = []
        if isinstance(history[0], dict):
            for item in history:
                p = item.get("price") or item.get("close") or item.get("value")
                if p is not None:
                    prices.append(float(p))
        elif isinstance(history[0], (int, float)):
            prices = [float(p) for p in history]

        if len(prices) < 2:
            return {
                "change_7d": None,
                "direction": "unknown",
                "description": "Insufficient data",
            }

        change_7d = ((prices[-1] - prices[0]) / prices[0]) * 100

        if change_7d > 5:
            direction, desc = (
                "strong_uptrend",
                f"Strong uptrend (+{change_7d:.1f}% over 7 days)",
            )
        elif change_7d > 1:
            direction, desc = "uptrend", f"Mild uptrend (+{change_7d:.1f}% over 7 days)"
        elif change_7d < -5:
            direction, desc = (
                "strong_downtrend",
                f"Strong downtrend ({change_7d:.1f}% over 7 days)",
            )
        elif change_7d < -1:
            direction, desc = (
                "downtrend",
                f"Mild downtrend ({change_7d:.1f}% over 7 days)",
            )
        else:
            direction, desc = "sideways", f"Sideways ({change_7d:.1f}% over 7 days)"

        mid = len(prices) // 2
        first_half_avg = sum(prices[:mid]) / mid
        second_half_avg = sum(prices[mid:]) / (len(prices) - mid)
        momentum = (
            "accelerating" if second_half_avg > first_half_avg else "decelerating"
        )

        return {
            "change_7d": round(change_7d, 2),
            "direction": direction,
            "description": desc,
            "momentum": momentum,
        }
    except Exception as e:
        log.warning(f"Price trend fetch failed for {slug}: {e}")
        return {
            "change_7d": None,
            "direction": "unknown",
            "description": "Could not fetch trend",
        }


def _detect_volume_anomaly(coin: dict) -> dict:
    """
    Detect volume anomaly using 24h price change as proxy.
    total_volume in Redis may not be in USD — use change_24h + market_cap instead.
    """
    try:
        change_24h = abs(float(coin.get("price_change_percentage_24h") or 0))
        volume_24h = float(coin.get("total_volume") or 0)
        market_cap = float(coin.get("market_cap") or 1)

        # If volume looks like it could be USD (> 1 billion), use ratio
        if volume_24h > 1_000_000_000 and market_cap > 0:
            ratio = volume_24h / market_cap
            if ratio > 0.25:
                return {
                    "anomaly": True,
                    "level": "extreme",
                    "ratio": round(ratio, 3),
                    "description": f"Extreme volume spike ({ratio:.1%} of market cap) — possible pump/dump or major news",
                }
            elif ratio > 0.08:
                return {
                    "anomaly": True,
                    "level": "high",
                    "ratio": round(ratio, 3),
                    "description": f"High volume ({ratio:.1%} of market cap) — elevated interest or volatility",
                }
            else:
                return {
                    "anomaly": False,
                    "level": "normal",
                    "ratio": round(ratio, 3),
                    "description": f"Normal volume ({ratio:.1%} of market cap)",
                }

        # Fallback: use 24h price change as volatility proxy
        if change_24h > 10:
            return {
                "anomaly": True,
                "level": "extreme",
                "ratio": None,
                "description": f"High volatility: {change_24h:.1f}% price change in 24h — significant market activity",
            }
        elif change_24h > 5:
            return {
                "anomaly": True,
                "level": "high",
                "ratio": None,
                "description": f"Elevated volatility: {change_24h:.1f}% price change in 24h",
            }
        elif change_24h < 0.3:
            return {
                "anomaly": False,
                "level": "low_volatility",
                "ratio": None,
                "description": f"Very low volatility: {change_24h:.1f}% change in 24h — consolidation phase",
            }
        else:
            return {
                "anomaly": False,
                "level": "normal",
                "ratio": None,
                "description": f"Normal volatility: {change_24h:.1f}% price change in 24h",
            }

    except Exception as e:
        log.warning(f"Volume anomaly check failed: {e}")
        return {
            "anomaly": False,
            "level": "unknown",
            "description": "Could not check volume",
        }


# ══════════════════════════════════════════════════════════════
# VALIDATION
# ══════════════════════════════════════════════════════════════


def _validate_position(coin: dict, entry_price, quantity) -> dict:
    warnings = []
    price = float(coin.get("current_price", 0))
    symbol = coin.get("symbol", "").upper()

    if entry_price and quantity:
        position_value = quantity * price
        cost_basis = quantity * entry_price
        pnl_pct = ((price - entry_price) / entry_price) * 100

        if position_value > 1_000_000_000:
            warnings.append(
                f"Position size ${position_value:,.0f} is unusually large — verify quantity ({quantity} {symbol})"
            )
        if cost_basis < 1:
            warnings.append("Cost basis under $1 — verify quantity")
        if abs(pnl_pct) > 1000:
            warnings.append(
                f"P&L of {pnl_pct:+.0f}% is extreme — verify entry price (${entry_price})"
            )

    return {"valid": len(warnings) == 0, "warnings": warnings}


def _validate_ai_response(response: dict, coin: dict, sig: dict) -> dict:
    price = float(coin.get("current_price", 0))
    signal = sig.get("signal", "neutral")

    if response.get("stop_loss") and price > 0:
        sl = float(response["stop_loss"])
        if signal == "bullish" and sl >= price:
            response["stop_loss"] = round(price * 0.93, 8)
        elif signal == "bearish" and sl <= price:
            response["stop_loss"] = round(price * 1.07, 8)

    if response.get("take_profit") and price > 0:
        tp = float(response["take_profit"])
        if signal == "bullish" and tp <= price:
            response["take_profit"] = round(price * 1.10, 8)
        elif signal == "bearish" and tp >= price:
            response["take_profit"] = round(price * 0.90, 8)

    if not response.get("summary"):
        response["summary"] = f"Technical analysis complete for {coin['name']}."
    if not response.get("key_factors"):
        response["key_factors"] = [f"Overall signal: {signal.upper()}"]
    if not response.get("personalized_advice"):
        response["personalized_advice"] = "Apply proper risk management."
    if "risk_level" not in response:
        response["risk_level"] = "medium"
    # action_tags validation
    if not response.get("action_tags") or not isinstance(response["action_tags"], list):
        response["action_tags"] = []
    # bullishness_score validation
    bs = response.get("bullishness_score")
    if bs is None or not isinstance(bs, (int, float)):
        response["bullishness_score"] = 50
    else:
        response["bullishness_score"] = max(0, min(100, int(bs)))

    if not response.get("indicator_breakdown") or not isinstance(
        response["indicator_breakdown"], dict
    ):
        response["indicator_breakdown"] = {}
    # Ensure all 5 keys exist — fill missing ones from ta if available
    ib = response["indicator_breakdown"]
    for key in ("rsi", "macd", "bollinger_bands", "stochastic", "ema"):
        if not ib.get(key):
            ib[key] = None  # frontend will hide None values

    return response


# ══════════════════════════════════════════════════════════════
# PROMPT BUILDER
# ══════════════════════════════════════════════════════════════


def _build_prompt(
    coin: dict,
    ta: dict,
    sig: dict,
    market_context: dict,
    entry_price=None,
    quantity=None,
    position_type="long",
    risk_tolerance="balanced",
    timeframe="short",
    validation: dict = None,
) -> str:
    price = float(coin["current_price"])
    confluence = ta.get("confluence", {})
    fg = market_context.get("fear_greed", {})
    trend = market_context.get("price_trend", {})
    volume = market_context.get("volume_anomaly", {})

    # ── BLOCK 1: USER POSITION ──
    if entry_price:
        pnl_pct = ((price - entry_price) / entry_price) * 100
        position_value = (quantity * price) if quantity else None
        pnl_usd = ((quantity * price) - (quantity * entry_price)) if quantity else None
        val_warnings = (validation or {}).get("warnings", [])
        warning_str = ("\n⚠️  " + "\n⚠️  ".join(val_warnings)) if val_warnings else ""

        if pnl_pct < -15:
            guidance = (
                f"URGENT: Position down {pnl_pct:.1f}%. Evaluate stop-loss immediately."
            )
        elif pnl_pct < -5:
            guidance = (
                f"Moderate loss ({pnl_pct:.1f}%). Monitor closely, consider stop-loss."
            )
        elif pnl_pct > 30:
            guidance = (
                f"Strong profit ({pnl_pct:.1f}%). Consider taking partial profits."
            )
        elif pnl_pct > 10:
            guidance = f"In profit ({pnl_pct:.1f}%). Trailing stop-loss recommended."
        else:
            guidance = f"Near entry ({pnl_pct:+.1f}%). Hold and monitor."

        position_block = f"""
╔══════════════════════════════════════════════════════╗
║           USER POSITION — ANALYZE THIS FIRST         ║
╚══════════════════════════════════════════════════════╝
Type           : {position_type.upper()}
Entry Price    : ${entry_price:,.6f}
Current Price  : ${price:,.6f}
Unrealized P&L : {pnl_pct:+.2f}%{f" (${pnl_usd:+,.2f})" if pnl_usd else ""}
Quantity       : {f"{quantity} {coin['symbol'].upper()}" if quantity else "not specified"}
Position Value : {f"${position_value:,.2f}" if position_value else "unknown"}
Risk Tolerance : {risk_tolerance}
Timeframe      : {timeframe}{warning_str}

GUIDANCE: {guidance}
Your personalized_advice MUST directly address this P&L situation.
══════════════════════════════════════════════════════════
"""
    else:
        position_block = """
╔══════════════════════════════════════════════════════╗
║                  NO ACTIVE POSITION                  ║
╚══════════════════════════════════════════════════════╝
User is watching — no entry yet.
Advice should cover: optimal entry zone, what signals to wait for, risk/reward.
══════════════════════════════════════════════════════════
"""

    # ── BLOCK 2: COIN & MARKET DATA ──
    change_24h = float(coin.get("price_change_percentage_24h") or 0)
    fg_value = fg.get("value") or 50
    fg_context = (
        "Extreme Fear — potential buying opportunity or continued panic"
        if fg_value < 25
        else (
            "Fear — market uncertain, caution advised"
            if fg_value < 45
            else (
                "Neutral — no strong sentiment bias"
                if fg_value < 55
                else (
                    "Greed — market optimistic, watch for reversal"
                    if fg_value < 75
                    else "Extreme Greed — elevated correction risk"
                )
            )
        )
    )

    market_block = f"""
COIN: {coin["name"]} ({coin["symbol"].upper()})
Current Price : ${price:,.6f}
24h Change    : {change_24h:+.2f}%
Market Cap    : ${coin.get('market_cap', 0):,.0f}
Volume (24h)  : ${coin.get('total_volume', 0):,.0f}

7-DAY PRICE TREND:
  Direction  : {trend.get('direction', 'unknown').replace('_', ' ').upper()}
  7d Change  : {f"{trend.get('change_7d', 0):+.2f}%" if trend.get('change_7d') is not None else "N/A"}
  Momentum   : {trend.get('momentum', 'unknown').upper()}
  Summary    : {trend.get('description', 'N/A')}

VOLUME:
  Status     : {volume.get('level', 'unknown').upper()}
  V/MC Ratio : {f"{volume.get('ratio', 0):.1%}" if volume.get('ratio') else "N/A"}
  Note       : {volume.get('description', 'N/A')}

FEAR & GREED INDEX:
  Score      : {fg.get('value', 'N/A')} / 100  ({fg.get('label', 'Unknown').upper()})
  Context    : {fg_context}
"""

    # ── BLOCK 3: TECHNICAL ANALYSIS ──
    def interp(signal, mapping):
        return mapping.get(signal, "")

    rsi_map = {
        "oversold": "→ Oversold: potential bounce, bullish reversal possible",
        "overbought": "→ Overbought: pullback risk, momentum may be exhausted",
        "bullish": "→ Bullish momentum building",
        "bearish": "→ Bearish momentum, selling pressure",
    }
    macd_map = {
        "bullish": "→ Bullish crossover / rising histogram: upward momentum",
        "bearish": "→ Bearish crossover / falling histogram: downward pressure",
    }
    bb_map = {
        "near_lower": "→ Near lower band: oversold zone, mean-reversion likely",
        "near_upper": "→ Near upper band: overbought zone, resistance ahead",
        "middle": "→ Near middle band: neutral, wait for breakout direction",
    }
    stoch_map = {
        "oversold": "→ Below 20: strong oversold, bullish reversal signal",
        "overbought": "→ Above 80: strong overbought, bearish reversal signal",
    }
    ema_map = {
        "bullish": "→ EMA20 > EMA50: uptrend confirmed",
        "bearish": "→ EMA20 < EMA50: downtrend in play",
    }

    signal_list = "\n".join(
        [
            f"  [{s['direction']}] {s['name']}"
            for s in (ta.get("signal_details") or [])[:12]
        ]
    )

    # pandas-ta sayısal değerleri — varsa kullan
    rsi_num = f"RSI = {ta['rsi']}" if ta.get("rsi") else ""
    macd_num = (
        f"MACD histogram = {ta.get('macd_histogram', '')}, line = {ta.get('macd_value', '')}"
        if ta.get("macd_histogram") is not None
        else ""
    )
    bb_num = (
        f"Price at {ta['bb_pct_b']:.0%} of band width (upper={ta.get('bb_upper','?')}, lower={ta.get('bb_lower','?')})"
        if ta.get("bb_pct_b") is not None
        else ""
    )
    stoch_num = (
        f"K={ta.get('stoch_k','?')}, D={ta.get('stoch_d','?')}"
        if ta.get("stoch_k") is not None
        else ""
    )
    ema_num = ta.get("ema_detail", "")
    sr_block = (
        f"Nearest Support: ${ta.get('support_level','?')} | Nearest Resistance: ${ta.get('resistance_level','?')}"
        if ta.get("support_level")
        else ""
    )
    data_src = (
        "pandas-ta (calculated from price history)"
        if ta.get("calculated")
        else "Altfins signals only"
    )

    ta_block = f"""
ALTFINS OVERALL SIGNAL: {sig["signal"].upper()} ({sig["confidence"]}% confidence)
Data source: {data_src}
Signals analyzed: {ta.get("data_points", 0)}

{sr_block}

INDICATOR BREAKDOWN (real calculated values):

1. RSI (14)
   Value  : {rsi_num or "no data"}
   Signal : {(ta.get("rsi_signal") or "no data").upper()}
   Altfins: {ta.get("rsi_detail") or "no signal"}
   {interp(ta.get("rsi_signal"), rsi_map)}

2. MACD (12/26/9)
   Values : {macd_num or "no data"}
   Trend  : {(ta.get("macd_trend") or "no data").upper()}
   Momentum: {ta.get("macd_momentum", "unknown")}
   Crossover: {ta.get("macd_crossover") or "none"}
   Altfins: {ta.get("macd_detail") or "no signal"}
   {interp(ta.get("macd_trend"), macd_map)}

3. Bollinger Bands (20, 2)
   Values : {bb_num or "no data"}
   Signal : {(ta.get("bb_signal") or "no data").upper().replace("_", " ")}
   Altfins: {ta.get("bb_detail") or "no signal"}
   {interp(ta.get("bb_signal"), bb_map)}

4. Stochastic (14, 3)
   Values : {stoch_num or "no data"}
   Signal : {(ta.get("stoch_signal") or "no data").upper()}
   Altfins: {ta.get("stoch_detail") or "no signal"}
   {interp(ta.get("stoch_signal"), stoch_map)}

5. EMA (20 / 50)
   Values : {ema_num or "no data"}
   Trend  : {(ta.get("ema_trend") or "no data").upper()}
   {interp(ta.get("ema_trend"), ema_map)}

CONFLUENCE:
  Bullish indicators : {confluence.get('bullish_indicators', 0)} / 5
  Bearish indicators : {confluence.get('bearish_indicators', 0)} / 5
  Dominant direction : {confluence.get('dominant', 'neutral').upper()}
  Conflicting?       : {"YES — mixed signals, higher uncertainty" if confluence.get('conflicting') else "NO — signals aligned"}

RECENT SIGNALS:
{signal_list}
"""

    # ── BLOCK 4: SL/TP REFERENCE ──
    sl_tp_block = f"""
STOP-LOSS / TAKE-PROFIT REFERENCE (current price: ${price:,.6f}):
  BUY scenario  → SL: ${price*0.92:,.6f} (-8%) | TP: ${price*1.15:,.6f} (+15%)
  SELL scenario → SL: ${price*1.07:,.6f} (+7%) | TP: ${price*0.90:,.6f} (-10%)
  Adjust for risk_tolerance={risk_tolerance} and timeframe={timeframe}
  Volume is {volume.get('level', 'normal')} — {"reduce position size" if volume.get('level') in ('low', 'extreme') else "normal sizing ok"}
"""

    # ── BLOCK 5: OUTPUT FORMAT ──
    output_block = """
TASK: You are a professional crypto technical analyst.
Analyze ALL data above. Respond ONLY with valid JSON (no markdown, no extra text):

{
  "summary": "3-4 sentences covering: (1) overall signal + confidence, (2) 7-day trend + momentum, (3) what indicators collectively suggest, (4) Fear & Greed + volume context. Use specific numbers.",
  "indicator_breakdown": {
    "rsi": "What RSI is showing and what it means for price action.",
    "macd": "MACD trend and momentum implication.",
    "bollinger_bands": "BB position and what it suggests.",
    "stochastic": "Stochastic reading and signal strength.",
    "ema": "EMA relationship and trend direction."
  },
  "key_factors": [
    "Most important technical signal with specific detail",
    "Second most important factor",
    "Risk factor or conflicting signal if any",
    "Volume or sentiment context"
  ],
  "personalized_advice": "2-3 sentences DIRECTLY addressing the user position. If in loss: stop-loss urgency. If in profit: profit taking strategy. If watching: specific entry criteria to wait for. Be direct.",
  "stop_loss": 12345.67,
  "take_profit": 15678.90,
  "risk_level": "low|medium|high",
  "bullishness_score": 65,
  "action_tags": ["TAG1", "TAG2"]
}

ACTION TAGS — pick 1-3 that apply from this list only:
  STRONG_BUY, BUY_THE_DIP, WAIT_FOR_BREAKOUT, WAIT_FOR_DIP,
  HOLD_AND_MONITOR, TIGHTEN_STOP_LOSS, TAKE_PARTIAL_PROFIT,
  TAKE_FULL_PROFIT, REDUCE_POSITION, AVOID_ENTRY,
  WATCH_SUPPORT, WATCH_RESISTANCE, HIGH_RISK_WARNING

BULLISHNESS SCORE rules (0-100 integer):
  0-20  = Strongly bearish
  21-40 = Bearish
  41-59 = Neutral / mixed
  60-74 = Bullish
  75-89 = Strongly bullish
  90-100 = Extreme bullish (use rarely)
  Base it on: indicator confluence, RSI level, MACD direction, trend, F&G

RULES:
- English only
- If user has NO ACTIVE POSITION: set stop_loss and take_profit to null
- If user has an active position: stop_loss and take_profit must be real numbers matching price scale
- BULLISH signal: stop_loss < current_price AND take_profit > current_price
- BEARISH signal: stop_loss > current_price AND take_profit < current_price
- NEUTRAL signal: provide levels for most likely next directional move
- If signals conflict: say so explicitly, do not fabricate clarity
- If volume is anomalous: mention it in key_factors
- If F&G is extreme: mention it in summary
- If news sentiment is strongly positive or negative: mention it in key_factors
- If a specific news event explains a price move or volume spike: reference it in summary

IMPORTANT — LEGAL COMPLIANCE:
- You are a technical analysis tool, NOT a financial advisor
- Never use phrases like "you should buy", "invest now", "guaranteed profit"
- Use technical language: "indicators suggest bullish momentum", "signal shows bearish pressure"
- Always frame advice as: "based on technical indicators..." or "the data suggests..."
- personalized_advice must end with a risk reminder
- Never promise returns or predict prices with certainty
"""

    # ── BLOCK 5: NEWS ──
    news_block = ""
    try:
        from backend.services.news_service import format_news_for_prompt

        news_data = market_context.get("news", {})
        news_block = (
            "\n"
            + format_news_for_prompt(
                news_data.get("items", []), news_data.get("sentiment", {})
            )
            + "\n"
        )
    except Exception:
        pass

    return (
        position_block
        + market_block
        + ta_block
        + news_block
        + sl_tp_block
        + output_block
    )


# ══════════════════════════════════════════════════════════════
# GROQ (PRIMARY)
# ══════════════════════════════════════════════════════════════


def _groq_comment(prompt: str) -> dict | None:
    if not GROQ_KEY:
        return None
    try:
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a professional crypto technical analyst. "
                            "Respond in English only with valid JSON. No markdown, no text outside JSON."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1000,
                "temperature": 0.25,
                "response_format": {"type": "json_object"},
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"].strip()
        return json.loads(text)
    except Exception as e:
        log.error(f"Groq error: {e}")
        return None


# ══════════════════════════════════════════════════════════════
# GEMINI (FALLBACK)
# ══════════════════════════════════════════════════════════════


def _gemini_comment(prompt: str) -> dict | None:
    if not GEMINI_KEY:
        return None
    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = resp.text.strip()
        for fence in ("```json", "```"):
            text = text.replace(fence, "")
        return json.loads(text.strip())
    except Exception as e:
        log.error(f"Gemini error: {e}")
        return None


# ══════════════════════════════════════════════════════════════
# STATIC FALLBACK
# ══════════════════════════════════════════════════════════════


def _static_fallback(coin: dict, ta: dict, sig: dict, market_context: dict) -> dict:
    signal = sig["signal"]
    price = float(coin["current_price"])
    confluence = ta.get("confluence", {})
    fg = market_context.get("fear_greed", {})
    trend = market_context.get("price_trend", {})

    factors = [
        f"Overall signal: {signal.upper()} ({sig['confidence']}% confidence, {ta.get('data_points', 0)} signals)",
        f"7-day trend: {trend.get('description', 'unknown')}",
        f"Fear & Greed: {fg.get('value', 'N/A')} — {fg.get('label', 'Unknown')}",
    ]
    if confluence.get("conflicting"):
        factors.append("⚠️ Conflicting signals — exercise caution")

    return {
        "summary": (
            f"{coin['name']} shows a {signal.upper()} signal. "
            f"7-day trend: {trend.get('description', 'unknown')}. "
            f"Market Fear & Greed at {fg.get('value', 'N/A')} ({fg.get('label', 'Unknown')}). "
            f"{'Indicators are consistent.' if not confluence.get('conflicting') else 'Some indicators conflict — caution advised.'}"
        ),
        "indicator_breakdown": {
            "rsi": ta.get("rsi_detail") or "No RSI data",
            "macd": ta.get("macd_detail") or "No MACD data",
            "bollinger_bands": ta.get("bb_detail") or "No BB data",
            "stochastic": ta.get("stoch_detail") or "No Stochastic data",
            "ema": f"EMA trend: {ta.get('ema_trend') or 'unknown'}",
        },
        "key_factors": factors[:4],
        "personalized_advice": (
            "Consider placing a stop-loss."
            if signal == "buy"
            else (
                "Consider reducing exposure."
                if signal == "sell"
                else "Wait for clearer signals before entering."
            )
        )
        + " Always manage risk carefully.",
        "stop_loss": (
            round(price * 0.92, 8)
            if signal in ("buy", "hold")
            else round(price * 1.07, 8)
        ),
        "take_profit": (
            round(price * 1.12, 8)
            if signal == "buy"
            else round(price * 0.90, 8) if signal == "sell" else None
        ),
        "risk_level": "medium",
    }


# ══════════════════════════════════════════════════════════════
# RISK CALCULATION
# ══════════════════════════════════════════════════════════════


def _calc_risk(ta: dict, sig: dict, market_context: dict) -> str:
    score = 0
    if sig["confidence"] < 60:
        score += 1
    if ta.get("stoch_signal") == "overbought":
        score += 1
    if ta.get("bb_signal") == "near_upper":
        score += 1
    if ta.get("rsi_signal") in ("bearish", "overbought"):
        score += 1
    if ta.get("confluence", {}).get("conflicting"):
        score += 1

    fg_value = market_context.get("fear_greed", {}).get("value")
    if fg_value and fg_value > 80:
        score += 1

    if market_context.get("volume_anomaly", {}).get("level") in ("extreme", "low"):
        score += 1

    return "high" if score >= 4 else "medium" if score >= 2 else "low"


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════


def analyze_coin(
    slug: str,
    entry_price: float = None,
    quantity: float = None,
    position_type: str = "long",
    risk_tolerance: str = "balanced",
    timeframe: str = "short",
) -> dict:
    coin = get_coin_by_slug(slug)
    if not coin:
        return {"error": f"Coin not found: {slug}"}
    if not coin.get("current_price"):
        return {"error": "No live price data available for this coin."}

    symbol = coin["symbol"].upper()

    # Altfins signals
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        altfins_data = loop.run_until_complete(get_full_analysis(symbol))
        loop.close()
    except Exception as e:
        log.error(f"Altfins fetch error: {e}")
        altfins_data = {"symbol": symbol, "signals": []}

    signals = altfins_data.get("signals") or []
    sig = parse_signal(signals)
    altfins_ta = parse_ta({}, signals)

    # Real indicator values from price_history (pandas-ta)
    try:
        from backend.services.technical_indicators import calculate_indicators

        ta = calculate_indicators(slug, altfins_ta)
        log.info(
            f"pandas-ta indicators calculated for {symbol}: RSI={ta.get('rsi')}, MACD={ta.get('macd_histogram')}"
        )
    except Exception as e:
        log.warning(f"pandas-ta failed, using Altfins only: {e}")
        ta = altfins_ta

    # Market context
    fear_greed = _fetch_fear_and_greed()
    price_trend = _fetch_price_trend(slug)
    volume_anomaly = _detect_volume_anomaly(coin)

    # News sentiment (free RSS feeds)
    news_items = []
    news_sentiment = {"sentiment": "neutral", "score": 0, "count": 0}
    try:
        from backend.services.news_service import get_coin_news, get_news_sentiment

        news_items = get_coin_news(coin["name"], coin["symbol"], max_results=5)
        news_sentiment = get_news_sentiment(news_items)
        log.info(
            f"News fetched for {symbol}: {len(news_items)} items, sentiment={news_sentiment['sentiment']}"
        )
    except Exception as e:
        log.warning(f"News fetch failed: {e}")

    market_context = {
        "fear_greed": fear_greed,
        "price_trend": price_trend,
        "volume_anomaly": volume_anomaly,
        "news": {
            "items": news_items,
            "sentiment": news_sentiment,
        },
    }

    # Validation
    validation = _validate_position(coin, entry_price, quantity)

    # Build prompt
    prompt = _build_prompt(
        coin=coin,
        ta=ta,
        sig=sig,
        market_context=market_context,
        entry_price=entry_price,
        quantity=quantity,
        position_type=position_type,
        risk_tolerance=risk_tolerance,
        timeframe=timeframe,
        validation=validation,
    )

    # Model chain
    comment = None
    if GROQ_KEY:
        comment = _groq_comment(prompt)
        if comment:
            log.info(f"Groq used for {symbol}")
    if comment is None and GEMINI_KEY:
        comment = _gemini_comment(prompt)
        if comment:
            log.info(f"Gemini fallback used for {symbol}")
    if comment is None:
        comment = _static_fallback(coin, ta, sig, market_context)
        log.warning(f"Static fallback used for {symbol}")

    comment = _validate_ai_response(comment, coin, sig)

    risk = comment.get("risk_level") or _calc_risk(ta, sig, market_context)
    sentiment = (
        "bullish"
        if sig["signal"] == "bullish"
        else "bearish" if sig["signal"] == "bearish" else "neutral"
    )

    if validation["warnings"]:
        comment["personalized_advice"] = (
            f"⚠️ {' | '.join(validation['warnings'])}\n\n"
            f"{comment.get('personalized_advice', '')}"
        )

    return {
        "signal": sig["signal"],
        "confidence": sig["confidence"],
        "sentiment": sentiment,
        "risk_level": risk,
        "coin": {
            "name": coin["name"],
            "symbol": coin["symbol"],
            "current_price": float(coin["current_price"]),
            "change_24h": float(coin.get("price_change_percentage_24h") or 0),
            "market_cap": float(coin.get("market_cap") or 0),
            "volume_24h": float(coin.get("total_volume") or 0),
            "image_url": coin.get("image_url"),
            "slug": slug,
        },
        "technical_data": {
            "rsi": ta.get("rsi"),
            "rsi_signal": ta.get("rsi_signal"),
            "rsi_detail": ta.get("rsi_detail"),
            "macd_trend": ta.get("macd_trend"),
            "macd_detail": ta.get("macd_detail"),
            "bb_position": ta.get("bb_position"),
            "bb_signal": ta.get("bb_signal"),
            "bb_detail": ta.get("bb_detail"),
            "stoch_signal": ta.get("stoch_signal"),
            "stoch_detail": ta.get("stoch_detail"),
            "ema_trend": ta.get("ema_trend"),
            "signal_details": ta.get("signal_details", []),
            "data_points": ta.get("data_points", 0),
            "data_source": "altfins",
            "confluence": ta.get("confluence", {}),
        },
        "market_context": market_context,
        "support_level": ta.get("support_level"),
        "resistance_level": ta.get("resistance_level"),
        "stop_loss": comment.get("stop_loss") if entry_price else None,
        "take_profit": comment.get("take_profit") if entry_price else None,
        "summary": comment.get("summary", ""),
        "indicator_breakdown": comment.get("indicator_breakdown", {}),
        "key_factors": comment.get("key_factors", []),
        "personalized_advice": comment.get("personalized_advice", ""),
        "data_source": "altfins",
        "timeframe": timeframe,
        "position_validation": validation,
        "bullishness_score": comment.get("bullishness_score", 50),
        "action_tags": comment.get("action_tags", []),
    }
