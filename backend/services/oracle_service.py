# ============================================================
# backend/services/oracle_service.py
# ============================================================
# Market Oracle — No-Key Backup Plan
#
# Data sources (zero API keys required):
#   1. Reddit r/CryptoCurrency  → public JSON endpoint
#   2. RSS Feeds                → CoinDesk + Cointelegraph (reuses
#                                  existing news_service helpers)
#
# AI pipeline:
#   Groq (llama-3.3-70b) → primary
#   Gemini 2.0 Flash     → fallback
#   Static rule fallback → if both fail
#
# Response shape:
#   {
#     "sentiment": {
#       "score": 62,
#       "label": "Greed",
#       "updated_at": "2026-05-23T18:00:00Z"
#     },
#     "insights": [
#       {
#         "id": 1,
#         "tag": "REDDIT",
#         "direction": "bullish",
#         "text": "...",
#         "source": "Reddit · r/CryptoCurrency",
#         "url": "https://reddit.com/r/...",
#         "age": "2h ago"
#       },
#       ...   (3 items)
#     ]
#   }
# ============================================================

import os
import json
import logging
import time
import httpx
import feedparser
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

log = logging.getLogger("oracle_service")

GROQ_KEY   = os.getenv("GROQ_API_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

# ── In-process cache to avoid hammering free endpoints ────────
_cache: dict = {}
_CACHE_TTL = 300  # 5 minutes


# ==============================================================
# 1.  DATA COLLECTION (no API keys)
# ==============================================================

REDDIT_URL = (
    "https://www.reddit.com/r/CryptoCurrency/hot.json"
    "?limit=10&raw_json=1"
)

# Keep a rotating index so successive calls pick a different UA
_UA_POOL = [
    "Mozilla/5.0 CryptoOracleBot/1.0 (contact: oracle@cryptodash.local)",
    "CryptoDashboard/2.0 (+https://github.com/user/crypto-data-pipeline)",
    "Python-httpx/0.27 CryptoNewsFeed/1.0",
]
_ua_idx = 0


def _next_ua() -> str:
    global _ua_idx
    ua = _UA_POOL[_ua_idx % len(_UA_POOL)]
    _ua_idx += 1
    return ua


def _age_str(dt: datetime) -> str:
    diff = datetime.now(timezone.utc) - dt
    hours = diff.total_seconds() / 3600
    if hours < 1:
        return f"{int(hours * 60)}m ago"
    if hours < 24:
        return f"{int(hours)}h ago"
    return f"{int(hours / 24)}d ago"


def fetch_reddit_posts(limit: int = 10) -> list[dict]:
    """Fetch hot posts from r/CryptoCurrency — no key needed."""
    try:
        resp = httpx.get(
            REDDIT_URL,
            headers={"User-Agent": _next_ua()},
            timeout=10.0,
            follow_redirects=True,
        )
        resp.raise_for_status()
        children = resp.json()["data"]["children"]
        posts = []
        for child in children[:limit]:
            d = child["data"]
            created = datetime.fromtimestamp(d["created_utc"], tz=timezone.utc)
            posts.append({
                "title":  d.get("title", ""),
                "source": "Reddit · r/CryptoCurrency",
                "url":    f"https://www.reddit.com{d.get('permalink', '')}",
                "age":    _age_str(created),
                "score":  d.get("score", 0),
                "text":   d.get("selftext", "")[:300],
            })
        log.info("Reddit: fetched %d posts.", len(posts))
        return posts
    except Exception as e:
        log.warning("Reddit fetch failed: %s", e)
        return []


RSS_FEEDS = [
    ("CoinDesk",      "https://www.coindesk.com/arc/outboundfeeds/rss/"),
    ("Cointelegraph", "https://cointelegraph.com/rss"),
]


def fetch_rss_headlines(max_per_feed: int = 5) -> list[dict]:
    """Parse public RSS feeds — no key needed."""
    results = []
    for source, url in RSS_FEEDS:
        try:
            resp = httpx.get(
                url,
                headers={"User-Agent": _next_ua()},
                timeout=8.0,
                follow_redirects=True,
            )
            resp.raise_for_status()
            feed = feedparser.parse(resp.text)
            for entry in feed.entries[:max_per_feed]:
                published = entry.get("published_parsed") or entry.get("updated_parsed")
                dt = datetime.now(timezone.utc)
                if published:
                    try:
                        dt = datetime(*published[:6], tzinfo=timezone.utc)
                    except Exception:
                        pass
                results.append({
                    "title":  entry.get("title", ""),
                    "source": source,
                    "url":    entry.get("link", ""),
                    "age":    _age_str(dt),
                    "score":  0,
                    "text":   "",
                })
        except Exception as e:
            log.warning("RSS fetch failed (%s): %s", source, e)
    log.info("RSS: fetched %d headlines.", len(results))
    return results


# ==============================================================
# 2.  AI ANALYSIS
# ==============================================================

# Common coin aliases for prompt context
_COIN_HINT = (
    "BTC=Bitcoin, ETH=Ethereum, SOL=Solana, BNB=BNB/Binance, XRP=Ripple, "
    "DOGE=Dogecoin, ADA=Cardano, AVAX=Avalanche, DOT=Polkadot, MATIC=Polygon, "
    "LINK=Chainlink, UNI=Uniswap, SHIB=Shiba Inu, LTC=Litecoin, ATOM=Cosmos, "
    "ARB=Arbitrum, OP=Optimism, INJ=Injective, SUI=Sui, APT=Aptos"
)


def _build_prompt(items: list[dict]) -> str:
    lines = []
    for i, item in enumerate(items[:15], 1):
        lines.append(f"{i}. [{item['source']} · {item['age']}] {item['title']}")
        if item.get("text"):
            lines.append(f"   {item['text'][:200]}")

    raw_text = "\n".join(lines)

    return f"""You are a professional crypto market analyst. Analyze these recent headlines and social posts from Reddit and top crypto news sites.

KNOWN COIN ALIASES: {_COIN_HINT}

RAW INPUT:
{raw_text}

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):

{{
  "sentiment_score": <integer 0-100>,
  "sentiment_label": "<Extreme Fear|Fear|Neutral|Greed|Extreme Greed>",
  "insights": [
    {{
      "tag": "<WHALE|MACRO|REGULATION|DEFI|LAYER2|MEME|REDDIT|NEWS|TECHNICAL>",
      "coin": "<UPPERCASE ticker e.g. BTC, ETH, SOL — or null if market-wide news>",
      "direction": "<bullish|bearish|neutral>",
      "text": "<One punchy sentence, max 120 chars, directly summarizing the most important signal>",
      "source_index": <1-based index of the headline this came from>
    }},
    {{...}},
    {{...}}
  ]
}}

RULES:
- Return exactly 3 insights
- sentiment_score: 0=Extreme Fear, 50=Neutral, 100=Extreme Greed
- coin: extract the PRIMARY coin ticker from the headline; use null if the news affects the whole market
- Each insight text must be specific (include coin names, % moves, or $ levels when visible)
- direction: "bullish" if positive for crypto, "bearish" if negative, "neutral" if informational
- English only
- Pick diverse items — try to cover different coins/topics"""


def _ai_analyze(items: list[dict]) -> dict | None:
    prompt = _build_prompt(items)

    # ── Groq (primary) ──
    if GROQ_KEY:
        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":    "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role":    "system",
                            "content": (
                                "You are a professional crypto market analyst. "
                                "Respond ONLY with valid JSON. No markdown, no text outside JSON."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens":      600,
                    "temperature":     0.25,
                    "response_format": {"type": "json_object"},
                },
                timeout=20.0,
            )
            resp.raise_for_status()
            result = json.loads(resp.json()["choices"][0]["message"]["content"])
            log.info("Oracle: Groq analysis complete.")
            return result
        except Exception as e:
            log.warning("Oracle Groq failed: %s", e)

    # ── Gemini (fallback) ──
    if GEMINI_KEY:
        try:
            from google import genai

            client = genai.Client(api_key=GEMINI_KEY)
            resp   = client.models.generate_content(
                model="gemini-2.0-flash", contents=prompt
            )
            text = resp.text.strip()
            for fence in ("```json", "```"):
                text = text.replace(fence, "")
            result = json.loads(text.strip())
            log.info("Oracle: Gemini analysis complete.")
            return result
        except Exception as e:
            log.warning("Oracle Gemini failed: %s", e)

    return None


def _static_fallback(items: list[dict]) -> dict:
    """Rule-based fallback — no AI needed."""
    POSITIVE = {"surge", "rally", "bullish", "breakout", "soar", "gain",
                "rise", "record", "high", "adoption", "upgrade", "launch"}
    NEGATIVE = {"crash", "drop", "fall", "bearish", "decline", "dump",
                "fear", "hack", "exploit", "ban", "regulation", "lawsuit",
                "plunge", "collapse", "scam", "fraud"}

    pos = neg = 0
    for item in items:
        words = set((item.get("title", "") + " " + item.get("text", "")).lower().split())
        pos += len(words & POSITIVE)
        neg += len(words & NEGATIVE)

    total = pos + neg or 1
    score = int(50 + ((pos - neg) / total) * 40)
    score = max(0, min(100, score))

    if score <= 20:   label = "Extreme Fear"
    elif score <= 40: label = "Fear"
    elif score <= 60: label = "Neutral"
    elif score <= 80: label = "Greed"
    else:             label = "Extreme Greed"

    # Simple coin extraction for fallback (scan title for known tickers)
    KNOWN_COINS = {
        "bitcoin": "BTC", "btc": "BTC",
        "ethereum": "ETH", "eth": "ETH",
        "solana": "SOL", "sol": "SOL",
        "bnb": "BNB", "binance": "BNB",
        "xrp": "XRP", "ripple": "XRP",
        "doge": "DOGE", "dogecoin": "DOGE",
        "cardano": "ADA", "ada": "ADA",
        "avalanche": "AVAX", "avax": "AVAX",
        "polygon": "MATIC", "matic": "MATIC",
        "chainlink": "LINK", "link": "LINK",
        "shib": "SHIB", "shiba": "SHIB",
        "litecoin": "LTC", "ltc": "LTC",
        "arbitrum": "ARB", "arb": "ARB",
        "optimism": "OP",
    }

    def _extract_coin(title: str) -> str | None:
        words = title.lower().split()
        for word in words:
            clean = word.strip(".,!?:;()[]")
            if clean in KNOWN_COINS:
                return KNOWN_COINS[clean]
        return None

    # Pick the top-3 most-upvoted / first available items as insights
    sorted_items = sorted(items, key=lambda x: x.get("score", 0), reverse=True)
    insights = []
    for i, item in enumerate(sorted_items[:3]):
        direction = "neutral"
        words = set(item.get("title", "").lower().split())
        if words & POSITIVE:
            direction = "bullish"
        elif words & NEGATIVE:
            direction = "bearish"
        insights.append({
            "tag":          "NEWS",
            "coin":         _extract_coin(item.get("title", "")),
            "direction":    direction,
            "text":         item["title"][:120],
            "source_index": i + 1,
        })

    return {"sentiment_score": score, "sentiment_label": label, "insights": insights}


# ==============================================================
# 3.  PUBLIC ENTRY POINT
# ==============================================================

def get_oracle_feed() -> dict:
    """
    Main function called by the FastAPI endpoint.
    Returns:
        {
            "sentiment": {"score": int, "label": str, "updated_at": str},
            "insights": [{"id", "tag", "direction", "text", "source", "url", "age"}, ...]
        }
    """
    # Cache check
    now = time.time()
    cached = _cache.get("oracle")
    if cached and (now - cached["ts"]) < _CACHE_TTL:
        log.debug("Oracle: serving from cache.")
        return cached["data"]

    # 1. Fetch raw data
    reddit_posts = fetch_reddit_posts(10)
    rss_headlines = fetch_rss_headlines(5)

    # Merge: Reddit first (richer signal), then RSS
    all_items = reddit_posts + rss_headlines

    if not all_items:
        # Complete outage fallback
        log.error("Oracle: no data sources available.")
        return {
            "sentiment": {"score": 50, "label": "Neutral", "updated_at": datetime.now(timezone.utc).isoformat()},
            "insights": [
                {"id": 1, "tag": "NEWS", "direction": "neutral",
                 "text": "Data sources temporarily unavailable. Try again shortly.",
                 "source": "System", "url": "", "age": "just now"},
            ],
        }

    # 2. AI analysis
    ai_result = _ai_analyze(all_items)
    if ai_result is None:
        ai_result = _static_fallback(all_items)

    # 3. Map source_index back to real URLs
    insights_out = []
    for idx, ins in enumerate(ai_result.get("insights", [])[:3], 1):
        src_idx = max(0, (ins.get("source_index") or 1) - 1)
        src_item = all_items[src_idx] if src_idx < len(all_items) else all_items[0]
        # coin: AI-extracted ticker or None (None means market-wide)
        coin = ins.get("coin")  # e.g. "BTC", "ETH", or None
        if isinstance(coin, str):
            coin = coin.upper().strip() or None
        insights_out.append({
            "id":        idx,
            "tag":       ins.get("tag", "NEWS"),
            "coin":      coin,          # NEW: primary coin ticker or null
            "direction": ins.get("direction", "neutral"),
            "text":      ins.get("text", src_item["title"])[:150],
            "source":    src_item["source"],
            "url":       src_item["url"],
            "age":       src_item["age"],
        })

    score = int(ai_result.get("sentiment_score", 50))
    score = max(0, min(100, score))
    label = ai_result.get("sentiment_label", "Neutral")

    data = {
        "sentiment": {
            "score":      score,
            "label":      label,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        "insights": insights_out,
    }

    # Cache the result
    _cache["oracle"] = {"ts": now, "data": data}

    return data
