# ============================================================
# backend/services/news_service.py
# ============================================================
# Fetches crypto news from free RSS feeds.
# Filters by coin name/symbol, returns last 5 relevant headlines.
# No API key needed.
#
# Sources:
#   - Cointelegraph
#   - CoinDesk
#   - Decrypt
# ============================================================

import logging
import feedparser
import httpx
from datetime import datetime, timezone, timedelta

log = logging.getLogger("news_service")

RSS_FEEDS = [
    ("Cointelegraph", "https://cointelegraph.com/rss"),
    ("CoinDesk",      "https://www.coindesk.com/arc/outboundfeeds/rss/"),
    ("Decrypt",       "https://decrypt.co/feed"),
]

TIMEOUT = 8.0
MAX_AGE_HOURS = 72  # son 3 günün haberleri


def get_coin_news(coin_name: str, coin_symbol: str, max_results: int = 5) -> list[dict]:
    """
    Coin ile ilgili haberleri RSS'ten çek ve filtrele.

    Returns:
        [{"title": ..., "source": ..., "url": ..., "age": "2h ago"}, ...]
    """
    keywords = _build_keywords(coin_name, coin_symbol)
    all_news = []

    for source_name, feed_url in RSS_FEEDS:
        try:
            items = _fetch_feed(feed_url, source_name, keywords)
            all_news.extend(items)
        except Exception as e:
            log.warning(f"RSS fetch failed ({source_name}): {e}")
            continue

    # Tarihe göre sırala (en yeni önce)
    all_news.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

    # Max age filtresi
    cutoff = datetime.now(timezone.utc) - timedelta(hours=MAX_AGE_HOURS)
    recent = [n for n in all_news if n.get("dt", datetime.now(timezone.utc)) > cutoff]

    return recent[:max_results]


def get_news_sentiment(news_items: list[dict]) -> dict:
    """
    Basit keyword-based sentiment analizi.
    Gerçek NLP değil — pozitif/negatif kelime sayısı.
    """
    if not news_items:
        return {"sentiment": "neutral", "score": 0, "count": 0}

    POSITIVE = {
        "surge", "rally", "bullish", "breakout", "soar", "gain", "rise",
        "record", "high", "adoption", "upgrade", "launch", "partnership",
        "growth", "profit", "buy", "accumulate", "support", "recovery",
        "pump", "moon", "ath", "outperform", "beat", "strong"
    }
    NEGATIVE = {
        "crash", "drop", "fall", "bearish", "decline", "dump", "sell",
        "fear", "risk", "hack", "exploit", "ban", "regulation", "lawsuit",
        "loss", "low", "weak", "panic", "liquidation", "warning", "concern",
        "plunge", "collapse", "scam", "fraud", "uncertainty"
    }

    pos_count = 0
    neg_count = 0

    for item in news_items:
        title = item.get("title", "").lower()
        words = set(title.split())
        pos_count += len(words & POSITIVE)
        neg_count += len(words & NEGATIVE)

    total = pos_count + neg_count
    if total == 0:
        return {"sentiment": "neutral", "score": 0, "count": len(news_items)}

    score = (pos_count - neg_count) / max(total, 1)  # -1 to +1

    if score > 0.3:
        sentiment = "positive"
    elif score < -0.3:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "score": round(score, 2),
        "positive_signals": pos_count,
        "negative_signals": neg_count,
        "count": len(news_items),
    }


# ── Private helpers ───────────────────────────────────────────

def _build_keywords(coin_name: str, coin_symbol: str) -> set[str]:
    """Coin için arama anahtar kelimeleri oluştur."""
    keywords = set()
    # İsim (bitcoin → bitcoin, Bitcoin)
    keywords.add(coin_name.lower())
    keywords.add(coin_symbol.lower())
    # Çok kelimeli isimler (wrapped bitcoin → wrapped, bitcoin)
    for word in coin_name.lower().split():
        if len(word) > 3:
            keywords.add(word)
    return keywords


def _fetch_feed(feed_url: str, source_name: str, keywords: set[str]) -> list[dict]:
    """RSS feed'i çek ve coin ile ilgili haberleri filtrele."""
    try:
        resp = httpx.get(feed_url, timeout=TIMEOUT, follow_redirects=True)
        resp.raise_for_status()
        feed = feedparser.parse(resp.text)
    except Exception as e:
        log.warning(f"Feed fetch error ({source_name}): {e}")
        return []

    results = []
    for entry in feed.entries[:30]:  # son 30 habere bak
        title = entry.get("title", "")
        summary = entry.get("summary", "")
        text = (title + " " + summary).lower()

        # Keyword match kontrolü
        if not any(kw in text for kw in keywords):
            continue

        # Tarih parse
        published = entry.get("published_parsed") or entry.get("updated_parsed")
        dt = None
        age_str = "recent"
        if published:
            try:
                dt = datetime(*published[:6], tzinfo=timezone.utc)
                age_hours = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
                if age_hours < 1:
                    age_str = f"{int(age_hours * 60)}m ago"
                elif age_hours < 24:
                    age_str = f"{int(age_hours)}h ago"
                else:
                    age_str = f"{int(age_hours / 24)}d ago"
            except Exception:
                pass

        results.append({
            "title": title,
            "source": source_name,
            "url": entry.get("link", ""),
            "age": age_str,
            "dt": dt or datetime.now(timezone.utc),
            "timestamp": dt.timestamp() if dt else 0,
        })

    return results


def format_news_for_prompt(news_items: list[dict], sentiment: dict) -> str:
    """Prompt'a eklenecek haber bloğu oluştur."""
    if not news_items:
        return "NEWS: No recent news found for this coin."

    lines = [f"NEWS SENTIMENT: {sentiment['sentiment'].upper()} (score: {sentiment['score']:+.2f}, based on {sentiment['count']} headlines)"]
    lines.append("RECENT HEADLINES:")
    for item in news_items:
        lines.append(f"  [{item['source']} · {item['age']}] {item['title']}")

    return "\n".join(lines)
