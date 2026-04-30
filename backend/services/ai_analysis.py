from google import genai
from google.genai import types
import json
import os
import re
from backend.services.technical_analysis import get_technical_analysis
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

def analyze_coin(slug: str) -> dict:
    ta_data = get_technical_analysis(slug)

    if "error" in ta_data:
        return ta_data

    coin = ta_data["coin"]
    ind  = ta_data["indicators"]

    if "error" in ind:
        return {"error": ind["error"]}

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
- Data points analyzed: {ind.get('data_points', 0)}

Respond ONLY with a valid JSON object, no markdown, no extra text:
{{
  "sentiment": "bullish" or "bearish" or "neutral",
  "signal": "buy" or "sell" or "hold",
  "risk_level": "low" or "medium" or "high",
  "confidence": number between 0-100,
  "summary": "2-3 sentence plain English summary of the technical situation",
  "key_factors": ["factor1", "factor2", "factor3"],
  "support_level": estimated support price as number or null,
  "resistance_level": estimated resistance price as number or null,
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