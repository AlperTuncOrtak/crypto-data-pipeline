# ============================================================
# backend/main.py
# ============================================================
# FastAPI uygulamasi. Tum HTTP endpoint'leri burada tanimli.
# Frontend (React) buraya istek atacak.
#
# Calistirmak icin proje root'unda:
#   uvicorn backend.main:app --reload
# Dev server http://localhost:8000 adresinde acilir.
# Otomatik API dokumanlari: http://localhost:8000/docs
# ============================================================
from dotenv import load_dotenv
from pathlib import Path
import time
import hmac
import hashlib
import httpx
from pydantic import BaseModel

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
from fastapi import FastAPI, Query, HTTPException, Depends, Request
from backend.auth import verify_token, verify_pro
from fastapi.middleware.cors import CORSMiddleware

from shared.db import get_connection
from backend.services.market_service import (
    get_latest_market,
    get_top_gainers,
    get_top_losers,
    get_highest_volume,
    get_sparklines,
)
from backend.services.alert_service import get_alerts
from backend.services.analysis_service import (
    get_multi_coin_history,
    get_multi_coin_performance,
    get_correlation_matrix,
)
from backend.services.coin_service import (
    get_coin_by_slug,
    get_coin_history,
    get_coin_stats,
)

app = FastAPI(title="Crypto Analytics API", version="2.0.0")


# -----------------------
# CORS MIDDLEWARE
# -----------------------
# Frontend (Vite dev server varsayilan 5173) backend'e istek
# atabilsin diye CORS aciyoruz. Production'da bu listeyi
# kendi domain'imize daraltacagiz.
import os as _os

_ALLOWED_ORIGINS = _os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://www.cryptoneko.online",
        "https://cryptoneko.online"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------
# HEALTH CHECK
# -----------------------
# Basit "servis ayakta mi" endpoint'i. Monitoring icin kullanilabilir.
@app.get("/health")
def health():
    return {"status": "ok"}


# -----------------------
# MARKET ENDPOINTS
# -----------------------
@app.get("/market")
def market(limit: int = 20):
    """En guncel market snapshot'i. Dashboard ana tablosu bunu kullanir."""
    return get_latest_market(limit)


@app.get("/market/gainers")
def gainers(limit: int = 5):
    """24h en cok yukselen coinler."""
    return get_top_gainers(limit)


@app.get("/market/losers")
def losers(limit: int = 5):
    """24h en cok dusen coinler."""
    return get_top_losers(limit)


@app.get("/market/volume")
def volume(limit: int = 5):
    """24h hacim en yuksek coinler."""
    return get_highest_volume(limit)


@app.get("/market/sparklines")
def sparklines(symbols: list[str] = Query(...), hours: int = 24):
    """
    Birden fazla coin icin son N saatin fiyat noktalari.
    Ornek: /market/sparklines?symbols=BTC&symbols=ETH&hours=24
    Donen: { "BTC": [{price, time}, ...], "ETH": [...] }
    """
    return get_sparklines(symbols, hours)

@app.get("/market/fear-and-greed")
def fear_and_greed():
    """
    Fetch Fear & Greed index from alternative.me
    Acts as a proxy to avoid frontend CORS issues.
    """
    import httpx
    try:
        resp = httpx.get("https://api.alternative.me/fng/", timeout=10.0)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch Fear & Greed: {str(e)}")


# -----------------------
# ALERTS
# -----------------------
@app.get("/alerts")
def alerts():
    """Rule-based alert listesi (Strong Increase / Sharp Drop / Rapid Movement)."""
    return get_alerts()


# -----------------------
# ANALYSIS ENDPOINTS
# -----------------------
# symbols parametresi query string'de multiple olarak gelir:
# ornek: /analysis/history?symbols=BTC&symbols=ETH&symbols=SOL
@app.get("/analysis/history")
def analysis_history(symbols: list[str] = Query(...), hours: int = 24):
    """Secili coinlerin fiyat gecmisi (chart icin)."""
    return get_multi_coin_history(symbols, hours)


@app.get("/analysis/performance")
def analysis_performance(symbols: list[str] = Query(...)):
    """Secili coinlerin toplam getirisi (karsilastirma tablosu icin)."""
    return get_multi_coin_performance(symbols)


@app.get("/analysis/correlation")
def analysis_correlation(symbols: list[str] = Query(...), hours: int = 24):
    """Secili coinlerin korelasyon matrisi."""
    return get_correlation_matrix(symbols, hours)


@app.get("/coin/{slug}")
def coin_detail(slug: str):
    """Tek bir coin'in metadata + en guncel fiyati."""
    coin = get_coin_by_slug(slug)
    if not coin:
        raise HTTPException(status_code=404, detail=f"Coin not found: {slug}")
    return coin


@app.get("/coin/{slug}/history")
def coin_history(slug: str, range: str = Query("24h", pattern="^(1h|24h|7d|30d|all)$")):
    """
    Coin'in fiyat geçmisi belirli bir zaman araliginda.
    range parametresi: 1h | 24h | 7d | 30d | all
    Pattern ile valide edilir - gecersiz deger 422 doner.
    """
    return get_coin_history(slug, range)


@app.get("/coin/{slug}/stats")
def coin_stats_endpoint(slug: str):
    """24h high/low ve data point sayisi."""
    return get_coin_stats(slug)


# ---------------------------------------------------------------------------
# Türev / kaldıraçlı token filtresi
# ---------------------------------------------------------------------------
# Gate.io / Bybit / OKX USDT listelerinde kaldıraçlı ETF tokenleri de bulunur
# (BTC3L, ETH5S, ZEC3L, FIL5S …).  Bunlar spot sembollerle aynı namespace'i
# paylaşır ve trending listesine sızarsa yanıltıcı veriler gösterilir.
#
# Kural: sembol en az bir rakamla ardından L veya S ile bitiyorsa türev say.
#   BTC3L  → türev  ✓      SOLS → spot  ✗  (başında rakam yok)
#   ETH5S  → türev  ✓      LINK → spot  ✗
#   ZEC3L  → türev  ✓      BTC  → spot  ✗
import re as _re

_DERIVATIVE_RE = _re.compile(r"\d+[LSls]$")


def _is_derivative(symbol: str) -> bool:
    """True → kaldıraçlı ETF (BTC3L, ETH5S…), False → normal spot coin."""
    return bool(_DERIVATIVE_RE.search(symbol.upper()))


@app.get("/market/trending")
def market_trending():
    """
    Momentum skoruna göre trending coinler (top 6).

    Skor = log10(volume + 1) × |change_24h|

    Bu formül:
      - Sadece pump olan ama hacmi sıfır küçük coinleri eliyor
        (Gainers listesiyle örtüşme engellenir)
      - Gerçekten işlem gören + hareket eden coinleri öne çıkarıyor
      - Kaldıraçlı ETF tokenler zaten _is_derivative ile dışlanıyor

    Minimum eşikler:
      - volume  >= 100_000 USD  (ciddiye alınabilir likidite)
      - |change| >= 3%          (gerçek bir hareket var)
    """
    import math
    from backend.services.market_service import get_latest_market

    MIN_VOLUME = 100_000  # USD
    MIN_CHANGE = 3.0  # %

    data = get_latest_market(limit=500)

    scored = []
    for c in data:
        # Türev filtresi
        if _is_derivative(c.get("symbol", "")):
            continue

        change = float(c.get("price_change_percentage_24h") or 0)
        volume = float(c.get("total_volume") or 0)

        # Minimum eşikler
        if volume < MIN_VOLUME or abs(change) < MIN_CHANGE:
            continue

        # Momentum skoru: hacmin log'u × mutlak değişim
        score = math.log10(volume + 1) * abs(change)
        scored.append((score, c))

    # Skora göre sırala, top 6 al
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:6]]


@app.get("/market/stats")
def market_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM latest_prices WHERE current_price > 0")
    coin_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return {"coin_count": coin_count}


@app.get("/ai/analyze/{slug}")
def ai_analyze(
    slug: str,
    entry_price: float = None,
    quantity: float = None,
    position_type: str = "long",
    risk_tolerance: str = "balanced",
    timeframe: str = "short",
    user: dict = Depends(verify_pro),
):
    from backend.services.ai_analysis import analyze_coin

    return analyze_coin(
        slug,
        entry_price=entry_price,
        quantity=quantity,
        position_type=position_type,
        risk_tolerance=risk_tolerance,
        timeframe=timeframe,
    )


@app.post("/ai/portfolio")
def ai_portfolio_analyze(payload: dict):
    """
    Portfolio AI analizi — Groq birincil, Gemini fallback.
    Body: { holdings: [{symbol, value, pnl_pct, quantity, avg_cost}], total_value, total_pnl }
    """
    import os, json, httpx

    holdings = payload.get("holdings", [])
    total_value = float(payload.get("total_value") or 0)
    total_pnl = float(payload.get("total_pnl") or 0)

    if not holdings:
        raise HTTPException(status_code=400, detail="No holdings provided")

    GROQ_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

    if not GROQ_KEY and not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="No AI API key configured")

    total_pnl_pct = (total_pnl / max(total_value, 1)) * 100
    top_holding = holdings[0] if holdings else {}
    top_pct = float(top_holding.get("value", 0)) / max(total_value, 1) * 100

    # Sektör eşleştirme (basit keyword bazlı)
    SECTORS = {
        "BTC": "Store of Value",
        "ETH": "Layer 1",
        "SOL": "Layer 1",
        "BNB": "Exchange Token",
        "XRP": "Payments",
        "ADA": "Layer 1",
        "AVAX": "Layer 1",
        "DOT": "Layer 0",
        "MATIC": "Layer 2",
        "LINK": "Oracle",
        "UNI": "DeFi",
        "AAVE": "DeFi",
        "MKR": "DeFi",
        "DOGE": "Meme",
        "SHIB": "Meme",
        "PEPE": "Meme",
        "WIF": "Meme",
        "LTC": "Payments",
        "BCH": "Payments",
        "XLM": "Payments",
        "ATOM": "Layer 0",
        "NEAR": "Layer 1",
        "APT": "Layer 1",
        "ARB": "Layer 2",
        "OP": "Layer 2",
        "IMX": "Layer 2",
        "FIL": "Storage",
        "ICP": "Web3",
        "VET": "Enterprise",
    }

    holdings_text = "\n".join(
        [
            f"- {h['symbol']} ({SECTORS.get(h['symbol'], 'Other')}): "
            f"${float(h.get('value') or 0):.2f} "
            f"({float(h.get('value') or 0)/max(total_value,1)*100:.1f}% of portfolio), "
            f"P&L: {float(h.get('pnl_pct') or 0):+.2f}%, "
            f"Qty: {float(h.get('quantity') or 0):.4f}, "
            f"Avg Cost: ${float(h.get('avg_cost') or 0):.4f}"
            for h in holdings[:12]
        ]
    )

    # Korelasyon uyarısı
    btc_pct = (
        sum(float(h.get("value") or 0) for h in holdings if h["symbol"] == "BTC")
        / max(total_value, 1)
        * 100
    )
    layer1_pct = (
        sum(
            float(h.get("value") or 0)
            for h in holdings
            if SECTORS.get(h["symbol"]) == "Layer 1"
        )
        / max(total_value, 1)
        * 100
    )
    meme_pct = (
        sum(
            float(h.get("value") or 0)
            for h in holdings
            if SECTORS.get(h["symbol"]) == "Meme"
        )
        / max(total_value, 1)
        * 100
    )

    # En riskli pozisyonlar
    best = max(holdings, key=lambda h: float(h.get("pnl_pct") or 0), default={})
    worst = min(holdings, key=lambda h: float(h.get("pnl_pct") or 0), default={})

    prompt = f"""You are a professional crypto portfolio risk analyst with 10+ years experience.
Analyze this portfolio deeply and respond ONLY with valid JSON (no markdown, no code fences):

{{
  "risk_score": <1-10 integer>,
  "risk_label": "<Low|Medium|High|Very High>",
  "summary": "<3-4 sentences. Cover: total return %, top holding concentration, sector exposure, biggest risk. Use specific numbers.>",
  "strengths": ["<specific strength with numbers>", "<strength 2>", "<strength 3>"],
  "risks": ["<specific risk with numbers>", "<risk 2>", "<risk 3>"],
  "recommendations": [
    "<actionable rec with specific % or coin name>",
    "<rec 2>",
    "<rec 3>"
  ],
  "dominant_sector": "<most represented sector>",
  "diversification_score": <1-10 integer>,
  "best_position": "<symbol of best performing position and why to consider taking profit>",
  "worst_position": "<symbol of worst performing position and what to do>",
  "correlation_risk": "<low|medium|high — how correlated are the holdings to BTC>",
  "sector_breakdown": {{
    "<sector name>": <percentage as integer>
  }}
}}

PORTFOLIO DATA:
Total Value: ${total_value:.2f}
Total P&L: ${total_pnl:+.2f} ({total_pnl_pct:+.1f}% return)
Number of holdings: {len(holdings)}
BTC allocation: {btc_pct:.1f}%
Layer 1 exposure: {layer1_pct:.1f}%
Meme coin exposure: {meme_pct:.1f}%
Best performer: {best.get('symbol','?')} at {float(best.get('pnl_pct',0)):+.1f}%
Worst performer: {worst.get('symbol','?')} at {float(worst.get('pnl_pct',0)):+.1f}%

HOLDINGS (with sector):
{holdings_text}

ANALYSIS RULES:
- risk_score: 1=very safe (pure BTC/ETH), 10=extremely risky (all memes/micro caps)
  Consider: concentration (top holding %), meme exposure, volatility, sector diversity
- diversification_score: 1=single coin, 10=perfectly spread across 5+ uncorrelated sectors
- correlation_risk: if >50% BTC → high, >30% → medium, else low
- best_position: the one with highest P&L — when to take profit?
- worst_position: the one with worst P&L — cut or hold?
- Be brutally honest but constructive
- All percentages in sector_breakdown should sum to ~100
- English only"""

    def try_groq():
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
                        "content": "You are a professional crypto portfolio risk analyst. Always respond with valid JSON only, no markdown, no explanation outside JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1000,
                "temperature": 0.3,
                "response_format": {"type": "json_object"},
            },
            timeout=25.0,
        )
        resp.raise_for_status()
        return json.loads(resp.json()["choices"][0]["message"]["content"].strip())

    def try_gemini():
        from google import genai

        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = resp.text.strip()
        for fence in ("```json", "```"):
            text = text.replace(fence, "")
        return json.loads(text.strip())

    result = None
    if GROQ_KEY:
        try:
            result = try_groq()
        except Exception:
            pass

    if result is None and GEMINI_KEY:
        try:
            result = try_gemini()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    if result is None:
        raise HTTPException(status_code=500, detail="All AI models failed")

    return result


@app.post("/ai/chat")
def ai_chat(payload: dict):
    """
    Genel amaçlı AI kripto asistanı.
    Body: { message: str, history?: [{role, content}] }
    Groq (llama-3.3-70b) → Gemini flash fallback.
    Canlı piyasa verisi otomatik eklenir (context injection).
    """
    import os, json, httpx, math

    message = (payload.get("message") or "").strip()
    history = payload.get("history") or []

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    GROQ_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

    if not GROQ_KEY and not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="No AI API key configured")

    # ── Canlı piyasa verisi ─────────────────────────────────────
    market_ctx = ""
    try:
        from backend.services.market_service import get_latest_market
        coins = get_latest_market(limit=50)
        btc = next((c for c in coins if c.get("symbol") == "BTC"), None)
        eth = next((c for c in coins if c.get("symbol") == "ETH"), None)

        gainers = sorted(
            [c for c in coins if float(c.get("price_change_percentage_24h") or 0) > 0],
            key=lambda c: float(c.get("price_change_percentage_24h") or 0),
            reverse=True,
        )[:3]
        losers = sorted(
            [c for c in coins if float(c.get("price_change_percentage_24h") or 0) < 0],
            key=lambda c: float(c.get("price_change_percentage_24h") or 0),
        )[:3]

        total_vol = sum(float(c.get("total_volume") or 0) for c in coins)

        lines = ["=== LIVE MARKET SNAPSHOT (right now) ==="]
        if btc:
            lines.append(f"BTC: ${float(btc.get('current_price',0)):,.0f}  ({float(btc.get('price_change_percentage_24h',0)):+.2f}% 24h)")
        if eth:
            lines.append(f"ETH: ${float(eth.get('current_price',0)):,.0f}  ({float(eth.get('price_change_percentage_24h',0)):+.2f}% 24h)")
        lines.append(f"Total 24h Volume (top 50): ${total_vol/1e9:.2f}B")

        if gainers:
            g_str = ", ".join(f"{c['symbol']} {float(c.get('price_change_percentage_24h',0)):+.1f}%" for c in gainers)
            lines.append(f"Top gainers: {g_str}")
        if losers:
            l_str = ", ".join(f"{c['symbol']} {float(c.get('price_change_percentage_24h',0)):+.1f}%" for c in losers)
            lines.append(f"Top losers:  {l_str}")

        market_ctx = "\n".join(lines)
    except Exception:
        market_ctx = ""

    # ── System prompt ───────────────────────────────────────────
    system_prompt = (
        "You are CryptoNeko AI Copilot, an expert crypto market assistant embedded in a "
        "premium analytics terminal. You have deep knowledge of DeFi, on-chain metrics, "
        "technical analysis, tokenomics, and macro crypto trends.\n\n"
        "Rules:\n"
        "- Be concise but insightful. 2-4 sentences max unless asked to elaborate.\n"
        "- Always cite the live data when relevant.\n"
        "- Never give explicit financial advice or tell users to buy/sell.\n"
        "- Use emoji sparingly for readability.\n"
        "- If asked about prices, always reference the live snapshot below.\n"
        "- Answer in the same language the user writes in (Turkish or English).\n"
    )
    if market_ctx:
        system_prompt += f"\n{market_ctx}\n"

    # ── Mesaj geçmişi ────────────────────────────────────────────
    # Son 8 mesajı al (context window tasarrufu)
    recent_history = history[-8:] if len(history) > 8 else history
    messages_for_api = (
        [{"role": "system", "content": system_prompt}]
        + recent_history
        + [{"role": "user", "content": message}]
    )

    def try_groq():
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages_for_api,
                "max_tokens": 512,
                "temperature": 0.6,
            },
            timeout=20.0,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()

    def try_gemini():
        from google import genai
        from google.genai import types

        contents = []
        for h in recent_history:
            role = "user" if h["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(h["content"])]))
        contents.append(types.Content(role="user", parts=[types.Part.from_text(message)]))

        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        return resp.text.strip()

    reply = None
    if GROQ_KEY:
        try:
            reply = try_groq()
        except Exception:
            pass

    if reply is None and GEMINI_KEY:
        try:
            reply = try_gemini()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

    if reply is None:
        raise HTTPException(status_code=500, detail="All AI models failed")

    return {"reply": reply}

_pulse_cache = {}

@app.get("/ai/pulse/{slug}")
def ai_pulse(slug: str):
    import time, os, httpx
    from backend.services.coin_service import get_coin_by_slug
    
    now = time.time()
    cached = _pulse_cache.get(slug)
    if cached and now - cached[0] < 300:
        return {"pulse": cached[1]}
        
    coin = get_coin_by_slug(slug)
    if not coin:
        raise HTTPException(status_code=404, detail="Coin not found")
        
    symbol = coin.get("symbol", "").upper()
    name = coin.get("name", "")
    price = float(coin.get("current_price", 0))
    change = float(coin.get("price_change_percentage_24h", 0) or 0)
    vol = float(coin.get("total_volume", 0) or 0)
    
    GROQ_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
    
    if not GROQ_KEY and not GEMINI_KEY:
        raise HTTPException(status_code=500, detail="No AI keys")
        
    prompt = f"Analyze why {name} ({symbol}) is moving right now. Current price: ${price}, 24h change: {change:+.2f}%, 24h volume: ${vol:,.0f}. Write strictly 1 or 2 short, punchy sentences explaining the probable cause or context of this movement (e.g., volume surge, market trend, anomaly). No generic filler."
    
    def try_groq():
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "system", "content": "You are a sharp crypto analyst."}, {"role": "user", "content": prompt}],
                "max_tokens": 150,
                "temperature": 0.5,
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
        
    def try_gemini():
        from google import genai
        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=f"You are a sharp crypto analyst.\n\n{prompt}")
        return resp.text.strip()
        
    reply = None
    if GROQ_KEY:
        try: reply = try_groq()
        except: pass
    if not reply and GEMINI_KEY:
        try: reply = try_gemini()
        except Exception as e: raise HTTPException(status_code=500, detail=str(e))
        
    if not reply:
        raise HTTPException(status_code=500, detail="AI failed")
        
    _pulse_cache[slug] = (now, reply)
    return {"pulse": reply}


@app.get("/market/volume-spikes")
def volume_spikes(limit: int = 10):
    from backend.services.volume_anomaly import get_recent_spikes

    return get_recent_spikes(limit)


# -----------------------
# MARKET ORACLE
# -----------------------
@app.get("/oracle-feed")
def oracle_feed():
    """
    Market Oracle — Sentiment + AI Gossip Radar.

    Aggregates Reddit r/CryptoCurrency hot posts + CoinDesk/Cointelegraph
    RSS headlines (zero API keys), processes them through the AI pipeline
    (Groq → Gemini → static fallback), and returns:
      {
        "sentiment": {"score": int, "label": str, "updated_at": str},
        "insights":  [{"id", "tag", "direction", "text", "source", "url", "age"}, ...]
      }

    Result is cached for 5 minutes to avoid hammering free endpoints.
    """
    from backend.services.oracle_service import get_oracle_feed

    return get_oracle_feed()


# ── STRIPE ────────────────────────────────────────────────────
@app.post("/create-checkout-session")
def create_checkout_session(payload: dict, user: dict = Depends(verify_token)):
    """
    Stripe Checkout session olusturur, frontend'i oraya yonlendirir.
    Body: { plan: "pro", billing: "monthly" | "yearly" }
    """
    import os, stripe

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    plan = payload.get("plan", "pro")
    billing = payload.get("billing", "monthly")

    # .env'deki price ID'leri:
    # STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY
    price_key = f"STRIPE_PRICE_{plan.upper()}_{billing.upper()}"
    price_id = os.getenv(price_key, "")
    if not price_id:
        raise HTTPException(
            status_code=400, detail=f"Price not configured: {price_key}"
        )

    frontend_url = os.getenv("FRONTEND_URL", "https://cryptoneko.online")

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{frontend_url}/pricing?success=1",
        cancel_url=f"{frontend_url}/pricing?cancelled=1",
        customer_email=user.get("email"),
        metadata={"user_id": user["id"], "plan": plan},
    )
    return {"url": session.url}


@app.post("/cancel-subscription")
def cancel_subscription(user: dict = Depends(verify_token)):
    """
    Kullanicinin aktif aboneligini Stripe uzerinden iptal eder.
    """
    import os, stripe
    from supabase import create_client

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_svc_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    sb = create_client(supabase_url, supabase_svc_key)

    res = sb.table("user_plans").select("stripe_sub_id, plan").eq("user_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No active plan found.")

    sub_id = res.data[0].get("stripe_sub_id")
    if not sub_id:
        raise HTTPException(status_code=400, detail="No active Stripe subscription found.")

    try:
        sub = stripe.Subscription.modify(sub_id, cancel_at_period_end=True)
        # We DO NOT downgrade the user to 'free' here.
        # They keep their plan until the billing period ends.
        # When it ends, Stripe fires 'customer.subscription.deleted' webhook
        # and we downgrade them to 'free' there.
        return {
            "ok": True, 
            "message": "Subscription will be canceled at the end of the current billing period."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe webhook — odeme tamamlaninca user_plans tablosuna yazar.
    Stripe Dashboard'da bu URL'i ekle:
      https://yourdomain.com/api/webhook
    Events: checkout.session.completed, customer.subscription.deleted
    """
    import os, stripe, json
    from supabase import create_client

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_svc_key = os.getenv("SUPABASE_SERVICE_KEY", "")

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    sb = create_client(supabase_url, supabase_svc_key)

    if event["type"] == "checkout.session.completed":
        obj = event["data"]["object"]
        meta = getattr(obj, "metadata", {}) or {}
        user_id = getattr(meta, "get", lambda x, y: None)("user_id", None) or getattr(meta, "user_id", None)
        if not user_id and isinstance(meta, dict):
            user_id = meta.get("user_id")
        plan = getattr(meta, "get", lambda x, y: "pro")("plan", "pro") or getattr(meta, "plan", "pro")
        if not plan and isinstance(meta, dict):
            plan = meta.get("plan", "pro")
        
        sub_id = getattr(obj, "subscription", None)

        if user_id:
            sb.table("user_plans").upsert(
                {
                    "user_id": user_id,
                    "plan": plan,
                    "stripe_sub_id": sub_id,
                    "expires_at": None,
                }
            ).execute()

    elif event["type"] == "customer.subscription.deleted":
        sub_id = getattr(event["data"]["object"], "id", None)
        if sub_id:
            # Abonelik iptal — free'ye duşur
            sb.table("user_plans").update({"plan": "free"}).eq(
                "stripe_sub_id", sub_id
            ).execute()

    return {"ok": True}


# ---------------------------------------------------------------------------
# BINANCE API SYNC
# ---------------------------------------------------------------------------
class BinanceSyncRequest(BaseModel):
    api_key: str
    api_secret: str

@app.post("/portfolio/binance-sync")
async def binance_sync(req: BinanceSyncRequest):
    """
    Kullanicinin gonderdigi API Key ve Secret ile Binance Spot bakiyelerini okur.
    CORS'u asmak ve secret'i guvenle kullanmak icin backend proxy gorevi gorur.
    """
    timestamp = int(time.time() * 1000)
    query_string = f"timestamp={timestamp}"
    
    signature = hmac.new(
        req.api_secret.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    url = f"https://api.binance.com/api/v3/account?{query_string}&signature={signature}"
    headers = {
        "X-MBX-APIKEY": req.api_key
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            
            balances = data.get("balances", [])
            active_balances = []
            for b in balances:
                free = float(b.get("free", 0))
                locked = float(b.get("locked", 0))
                total = free + locked
                if total > 0:
                    active_balances.append({
                        "symbol": b.get("asset"),
                        "quantity": total
                    })
                    
            return {"ok": True, "balances": active_balances}
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid API Key or Secret, or IP restriction enabled.")
            else:
                raise HTTPException(status_code=400, detail=f"Binance API error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
