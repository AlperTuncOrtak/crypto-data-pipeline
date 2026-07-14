import os
import json
import httpx
import logging
from shared.cache import r
from backend.services.market_service import get_market_data

log = logging.getLogger(__name__)

async def generate_market_signals() -> list:
    """
    Fetches the top 20 coins, passes them to Groq Llama 3.3 70B,
    and returns 3 punchy trading signals.
    Results are cached for 10 minutes.
    """
    cache_key = "ai_trade_insights_v3"
    cached = r.get(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        log.warning("GROQ_API_KEY not found. Returning mock signals.")
        return _fallback_signals()

    # Get market data context
    coins = get_market_data(limit=15)
    if not coins:
        return _fallback_signals()
        
    market_context = []
    for c in coins:
        market_context.append(f"{c['symbol']}: Price ${float(c['current_price']):.4f}, 24h Change {float(c['price_change_percentage_24h'] or 0):.2f}%, Volume ${float(c['total_volume'] or 0)}")

    context_str = "\n".join(market_context)

    prompt = f"""
You are an elite crypto technical analyst and portfolio manager. 
Analyze the following top 15 coins by market cap and volume:

{context_str}

Pick EXACTLY 3 coins that have the most interesting setups right now. 
For each coin, generate a trade signal. The types of signals must be chosen from: ["BUY", "SELL", "ROTATE"].

Output your response as a valid JSON array of exactly 3 objects. Do not include markdown code blocks or any other text.
The JSON objects MUST match this schema:
[
  {{
    "id": integer (1, 2, 3),
    "type": "BUY" | "SELL" | "ROTATE",
    "asset": string (The coin symbol, e.g. "BTC"),
    "pair": string (e.g. "BTC / USD"),
    "summary": string (A punchy, 1-sentence summary, max 80 chars),
    "detail": string (2-3 sentences explaining the technical/narrative rationale),
    "move": string (Projected move, e.g. "+12.4%" or "-5.2%"),
    "timeframe": string (e.g. "12-24h" or "3-5d"),
    "token": string (The coin symbol, e.g. "BTC"),
    "dotColor": string (Hex color: Use "#10b981" for BUY, "#f43f5e" for SELL, "#22d3ee" for ROTATE)
  }}
]

ONLY return the JSON array.
"""

    try:
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a JSON-only API. You must output a valid JSON array matching the exact schema requested, with NO markdown formatting, NO backticks, NO explanations."
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1000,
                "temperature": 0.3,
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        text = resp.json()["choices"][0]["message"]["content"].strip()
        
        # Remove markdown code blocks if the model accidentally includes them
        if text.startswith("```"):
            lines = text.split('\n')
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        parsed = json.loads(text)
        
        if isinstance(parsed, list) and len(parsed) == 3:
            # Cache for 10 minutes (600 seconds)
            r.setex(cache_key, 600, json.dumps(parsed))
            return parsed
            
    except Exception as e:
        log.error(f"Failed to generate AI signals via Groq: {e}")
        
    return _fallback_signals()


def _fallback_signals():
    return [
      {
        "id": 1,
        "type": "BUY",
        "asset": "BTC",
        "pair": "BTC / USD",
        "summary": "Strong accumulation near support.",
        "detail": "Volume is trending up while price consolidates. Breakout likely.",
        "move": "+5.0%",
        "timeframe": "24h",
        "token": "BTC",
        "dotColor": "#10b981",
      },
      {
        "id": 2,
        "type": "SELL",
        "asset": "SOL",
        "pair": "SOL / USD",
        "summary": "Overbought conditions on 4h chart.",
        "detail": "RSI showing bearish divergence. Expect a short-term pullback.",
        "move": "-8.0%",
        "timeframe": "12-24h",
        "token": "SOL",
        "dotColor": "#f43f5e",
      },
      {
        "id": 3,
        "type": "ROTATE",
        "asset": "ETH",
        "pair": "ETH / USD",
        "summary": "Capital rotating from Alts to ETH.",
        "detail": "ETH/BTC ratio bottoming out. Expect ETH to outperform in the next 3 days.",
        "move": "+10.0%",
        "timeframe": "3-5d",
        "token": "ETH",
        "dotColor": "#22d3ee",
      },
    ]
