from google import genai
import json
import os
import re
from backend.services.technical_analysis import get_technical_analysis
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

def analyze_coin(
    slug: str,
    entry_price: float = None,
    quantity: float = None,
    position_type: str = "long",
    risk_tolerance: str = "balanced",
    timeframe: str = "short"
) -> dict:

    ta_data = get_technical_analysis(slug)
    if "error" in ta_data:
        return ta_data

    coin = ta_data["coin"]
    ind  = ta_data["indicators"]

    if "error" in ind:
        return {"error": ind["error"]}

    # Kullanıcı pozisyon bilgisi
    user_context = ""
    if entry_price:
        pnl_pct = ((coin['current_price'] - entry_price) / entry_price) * 100
        position_value = quantity * coin['current_price'] if quantity else None
        user_context = f"""
USER POSITION:
- Entry Price: ${entry_price}
- Current P&L: {pnl_pct:+.2f}%
- Quantity: {f"{quantity} {coin['symbol']}" if quantity else 'not specified'}
- Position Value: {f"${position_value:,.2f}" if position_value else 'N/A'}
- Position Type: {position_type}
"""

    user_context += f"""
USER PREFERENCES:
- Risk Tolerance: {risk_tolerance}
- Investment Timeframe: {timeframe}
"""

    has_position = bool(entry_price)

    prompt = f"""You are a professional cryptocurrency technical analyst.
Analyze the following technical indicators and provide a structured assessment.

COIN: {coin['name']} ({coin['symbol']})
Current Price: ${coin['current_price']}
24h Change: {coin['change_24h']}%
24h Volume: ${coin['volume_24h']:,.0f}

TECHNICAL INDICATORS:
- RSI (14): {ind.get('rsi', 'N/A')} → {ind.get('rsi_signal', 'N/A')}
- MACD Trend: {ind.get('macd_trend', 'N/A')} (diff: {ind.get('macd_diff', 'N/A')})
- Bollinger Bands Position: {ind.get('bb_position', 'N/A')} → {ind.get('bb_signal', 'N/A')}
- EMA Trend (20/50): {ind.get('ema_trend', 'N/A')}
- Period High: {ind.get('highest', 'N/A')}
- Period Low: {ind.get('lowest', 'N/A')}
- Data points: {ind.get('data_points', 0)}

{user_context}

Respond ONLY with a valid JSON object, no markdown:
{{
  "sentiment": "bullish" or "bearish" or "neutral",
  "signal": "buy" or "sell" or "hold",
  "risk_level": "low" or "medium" or "high",
  "confidence": number 0-100,
  "summary": "2-3 sentence technical summary",
  "key_factors": ["factor1", "factor2", "factor3"],
  "support_level": number or null,
  "resistance_level": number or null,
  "stop_loss": {"recommended stop-loss price based on technical levels and risk tolerance" if has_position else null},
  "take_profit": {"recommended take-profit price" if has_position else null},
  "personalized_advice": {"2-3 sentences specific to this user position, P&L, risk tolerance and timeframe" if has_position else null},
  "disclaimer": "This is technical analysis only, not financial advice."
}}"""

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
    )

    raw = response.text.strip()

    try:
        raw_clean = re.sub(r'```(?:json)?', '', raw).strip().strip('`')
        result = json.loads(raw_clean)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            result = json.loads(match.group())
        else:
            return {"error": "Failed to parse AI response", "raw": raw}

    result["technical_data"] = {
        "rsi": ind.get('rsi'),
        "rsi_signal": ind.get('rsi_signal'),
        "macd_trend": ind.get('macd_trend'),
        "bb_position": ind.get('bb_position'),
        "bb_signal": ind.get('bb_signal'),
        "ema_trend": ind.get('ema_trend'),
        "current_price": coin['current_price'],
        "change_24h": coin['change_24h'],
        "data_points": ind.get('data_points'),
    }
    result["coin"] = coin

    return result