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
import pymysql
from pydantic import BaseModel

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
from fastapi import FastAPI, Query, HTTPException, Depends, Request
from backend.auth import verify_token, verify_pro
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

from shared.db import get_connection
from backend.services.market_service import (
    get_latest_market,
    get_top_gainers,
    get_top_losers,
    get_highest_volume,
    get_sparklines,
    get_global_market_history,
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
from backend.services.exchange_service import sync_exchange_balance
from backend.services.llm_config import GROQ_MODEL

class ExchangeSyncRequest(BaseModel):
    exchange_id: str
    api_key: str
    secret: str
    password: str = None

import os as _os

# Prod'da interaktif API dokumanlarini kapat — tum endpoint yuzeyini
# disariya listelemenin bir faydasi yok. DEBUG=1 ile lokalde acilir.
_DEBUG = _os.getenv("DEBUG", "").lower() in ("1", "true", "yes")

app = FastAPI(
    title="Crypto Analytics API",
    version="2.0.0",
    docs_url="/docs" if _DEBUG else None,
    redoc_url="/redoc" if _DEBUG else None,
    openapi_url="/openapi.json" if _DEBUG else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# -----------------------
# CORS MIDDLEWARE
# -----------------------
# Sadece kendi frontend origin'lerimize izin veriyoruz.
# DIKKAT: allow_credentials=True ile allow_origins=["*"] birlesince
# Starlette gelen Origin'i aynen yansitir; yani herkese acik hale gelir.
# Bu yuzden "*" degeri burada bilerek reddediliyor.
_DEFAULT_ORIGINS = "https://www.cryptoneko.online,https://cryptoneko.online"
_ALLOWED_ORIGINS = [
    o.strip()
    for o in _os.getenv("ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if o.strip() and o.strip() != "*"
]
if _DEBUG:
    _ALLOWED_ORIGINS += ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

from backend.routers import whale, stripe_router, wallet

app.include_router(whale.router)
app.include_router(stripe_router.router)
# Eski "/webhook" yolu: Stripe Dashboard'daki kayitli URL degistirilene kadar
# ayni handler'a bagli kalmali, yoksa gelen odeme event'leri 404 alir.
app.include_router(stripe_router.legacy_router)
app.include_router(wallet.router)


# -----------------------
# HEALTH CHECK
# -----------------------
# Basit "servis ayakta mi" endpoint'i. Monitoring icin kullanilabilir.
@app.get("/health")
@limiter.limit("5/minute")
def health(request: Request):
    return {"status": "ok"}


# -----------------------
# MARKET ENDPOINTS
# -----------------------
@app.get("/market")
@limiter.limit("60/minute")
def market(request: Request, limit: int = 20):
    """En guncel market snapshot'i. Dashboard ana tablosu bunu kullanir."""
    return get_latest_market(limit)


from backend.services.leaderboard_service import generate_leaderboard

@app.get("/portfolio/leaderboard")
def get_leaderboard():
    """Returns gamified leaderboard of top simulated traders."""
    return generate_leaderboard()

@app.get("/market/narratives")
def get_narratives():
    """Returns dynamically generated market narratives/sectors."""
    # We will generate it right here or from market_service
    import random
    from datetime import datetime
    seed = int(datetime.utcnow().strftime('%Y%m%d'))
    rng = random.Random(seed)
    
    narratives = [
        {"id": "meme", "name": "Memecoins", "color": "#e11d48", "coins": ["PEPE", "WIF", "DOGE"], "summary": "Retail liquidity continues to rotate aggressively into memecoins."},
        {"id": "ai", "name": "Artificial Intelligence", "color": "#7c3aed", "coins": ["FET", "RNDR", "TAO"], "summary": "Recent tech earnings have reignited volume across the AI crypto sector."},
        {"id": "l2", "name": "L2 Scaling", "color": "#d97706", "coins": ["ARB", "OP", "STRK"], "summary": "Token unlocks and fragmented liquidity suppress price action in major Layer 2s."},
        {"id": "rwa", "name": "Real World Assets", "color": "#10b981", "coins": ["ONDO", "PENDLE", "LINK"], "summary": "Institutional tokenized funds drive real-world asset protocols."},
        {"id": "depin", "name": "DePIN", "color": "#2563eb", "coins": ["FIL", "HNT", "AKT"], "summary": "DePIN networks see steady growth as hardware mining models prove sustainable."},
        {"id": "gaming", "name": "GameFi", "color": "#059669", "coins": ["IMX", "GALA", "RON"], "summary": "AAA gaming sector is quietly building with several titles entering beta."}
    ]
    
    for n in narratives:
        n["size"] = rng.randint(120, 300)
        n["score"] = rng.randint(30, 99)
        if n["score"] > 80:
            n["sentiment"] = "Extreme Greed"
            n["trend"] = "up"
        elif n["score"] > 60:
            n["sentiment"] = "Bullish"
            n["trend"] = "up"
        elif n["score"] > 40:
            n["sentiment"] = "Neutral"
            n["trend"] = "neutral"
        else:
            n["sentiment"] = "Bearish"
            n["trend"] = "down"
            
        n["x"] = f"{rng.randint(10, 80)}%"
        n["y"] = f"{rng.randint(10, 80)}%"
        n["delay"] = round(rng.uniform(0, 0.8), 1)
        
    # Sort by size descending
    narratives.sort(key=lambda x: x["size"], reverse=True)
    return narratives


@app.get("/market/stats")
def market_stats():
    """Global market istatistiklerini hesaplar ve döner."""
    coins = get_latest_market(3000)
    
    total_mcap = sum(float(c.get("market_cap") or 0) for c in coins)
    total_vol = sum(float(c.get("total_volume") or 0) for c in coins)
    
    btc = next((c for c in coins if c.get("symbol", "").upper() == "BTC"), None)
    eth = next((c for c in coins if c.get("symbol", "").upper() == "ETH"), None)
    
    btc_mcap = float(btc.get("market_cap") or 0) if btc else 0
    eth_mcap = float(eth.get("market_cap") or 0) if eth else 0
    
    btc_dom = (btc_mcap / total_mcap * 100) if total_mcap > 0 else 0
    eth_dom = (eth_mcap / total_mcap * 100) if total_mcap > 0 else 0
    
    return {
        "total_market_cap": {"usd": total_mcap},
        "total_volume": {"usd": total_vol},
        "market_cap_percentage": {
            "btc": btc_dom,
            "eth": eth_dom
        }
    }


@app.get("/market/global-history")
def global_market_history(days: int = 30):
    """30 gunluk global market cap, volume ve dominance gecmisi."""
    return get_global_market_history(days)


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
@limiter.limit("10/minute")
def ai_portfolio_analyze(request: Request, payload: dict, user: dict = Depends(verify_token)):
    """
    Portfolio AI analizi — Groq birincil, Gemini fallback.
    Body: { holdings: [{symbol, value, pnl_pct, quantity, avg_cost}], total_value, total_pnl }

    Auth zorunlu: bu endpoint her cagrida ucretli LLM API'sine gidiyor,
    acik birakmak kotanin bedavaya tuketilmesi demek.
    """
    import os, json, httpx

    holdings = payload.get("holdings", [])
    total_value = float(payload.get("total_value") or 0)
    total_pnl = float(payload.get("total_pnl") or 0)

    if not holdings:
        return {
            "risk_score": 0,
            "risk_label": "N/A",
            "diversification_score": 0,
            "dominant_sector": "None",
            "summary": "Your portfolio is currently empty. The AI Engine requires assets to perform an analysis.",
            "recommendations": ["Connect an exchange or add an on-chain wallet to begin tracking your assets."],
            "strengths": ["Zero market risk exposure."],
            "risks": ["100% fiat/cash equivalent, missing potential upside."],
            "best_position": "N/A",
            "worst_position": "N/A"
        }

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
                "model": GROQ_MODEL,
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
@limiter.limit("20/minute")
def ai_chat(request: Request, payload: dict, user: dict = Depends(verify_token)):
    """
    Genel amaçlı AI kripto asistanı. (Streaming)
    Body: { message: str, history?: [{role, content}], context?: {path: str} }
    """
    import os, json, httpx
    from fastapi.responses import StreamingResponse
    from backend.auth import verify_pro
    from shared.db import get_connection
    from datetime import datetime, timezone

    # ── Check Usage Limits ──────────────────────────────────────
    # User's plan checks
    try:
        verify_pro(user)
        is_pro = True
    except HTTPException:
        is_pro = False

    if not is_pro:
        conn = get_connection()
        cur = conn.cursor(pymysql.cursors.DictCursor)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        cur.execute("SELECT count, last_reset FROM user_ai_usage WHERE user_id = %s", (user['id'],))
        row = cur.fetchone()
        
        if row:
            if str(row['last_reset']) != today:
                cur.execute("UPDATE user_ai_usage SET count = 0, last_reset = %s WHERE user_id = %s", (today, user['id']))
                msg_count = 0
            else:
                msg_count = row['count']
        else:
            cur.execute("INSERT INTO user_ai_usage (user_id, count, last_reset) VALUES (%s, 0, %s)", (user['id'], today))
            msg_count = 0
            
        if msg_count >= 5:
            conn.close()
            raise HTTPException(status_code=403, detail="Limit reached")
            
        cur.execute("UPDATE user_ai_usage SET count = count + 1 WHERE user_id = %s", (user['id'],))
        conn.close()

    message = (payload.get("message") or "").strip()
    history = payload.get("history") or []
    context_data = payload.get("context") or {}

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
        from backend.services.coin_service import get_coin_by_slug
        
        lines = ["=== LIVE MARKET SNAPSHOT ==="]
        
        # Eğer spesifik bir coin sayfasındaysa (Örn: /coin/solana)
        path = context_data.get("path", "")
        if path.startswith("/coin/"):
            slug = path.split("/")[-1]
            try:
                coin_data = get_coin_by_slug(slug)
                if coin_data:
                    lines.append(f"USER IS CURRENTLY VIEWING: {coin_data['name']} ({coin_data['symbol'].upper()})")
                    lines.append(f"Price: ${float(coin_data.get('current_price',0)):,.4f}")
                    lines.append(f"24h Change: {float(coin_data.get('price_change_percentage_24h',0)):+.2f}%")
                    lines.append(f"Market Cap: ${float(coin_data.get('market_cap',0)):,.0f}")
                    lines.append("----------------------------")
            except Exception:
                pass

        coins = get_latest_market(limit=50)
        btc = next((c for c in coins if c.get("symbol") == "BTC"), None)
        eth = next((c for c in coins if c.get("symbol") == "ETH"), None)

        if btc:
            lines.append(f"BTC: ${float(btc.get('current_price',0)):,.0f} ({float(btc.get('price_change_percentage_24h',0)):+.2f}%)")
        if eth:
            lines.append(f"ETH: ${float(eth.get('current_price',0)):,.0f} ({float(eth.get('price_change_percentage_24h',0)):+.2f}%)")
        
        market_ctx = "\n".join(lines)
    except Exception:
        market_ctx = ""

    # ── System prompt ───────────────────────────────────────────
    system_prompt = (
        "You are CryptoNeko AI Copilot, a Tier-1 elite crypto market analyst. "
        "You provide robust, data-backed insights with a professional and confident tone.\n\n"
        "Rules:\n"
        "- Give clear, concise answers (2-4 sentences) unless deep analysis is requested.\n"
        "- Structure your answers beautifully using markdown, bold text for key metrics.\n"
        "- If you talk about prices, YOU MUST reference the LIVE MARKET SNAPSHOT below.\n"
        "- DO NOT give exact price predictions (e.g. 'BTC will hit 100k tomorrow'). Instead say 'Based on current technicals, the momentum points towards...'.\n"
        "- Always add a brief disclaimer that this is not financial advice if discussing trades.\n"
        "- Answer in the same language the user writes in.\n"
    )
    if market_ctx:
        system_prompt += f"\n{market_ctx}\n"

    recent_history = history[-8:] if len(history) > 8 else history
    messages_for_api = (
        [{"role": "system", "content": system_prompt}]
        + recent_history
        + [{"role": "user", "content": message}]
    )

    def stream_groq():
        with httpx.Client() as client:
            with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_KEY}"},
                json={
                    "model": GROQ_MODEL,
                    "messages": messages_for_api,
                    "max_tokens": 1024,
                    "temperature": 0.5,
                    "stream": True,
                },
                timeout=20.0,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            token = chunk["choices"][0]["delta"].get("content", "")
                            if token:
                                yield f"data: {json.dumps({'text': token})}\n\n"
                        except Exception:
                            pass

    def stream_gemini():
        from google import genai
        from google.genai import types

        contents = []
        for h in recent_history:
            role = "user" if h["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(h["content"])]))
        contents.append(types.Content(role="user", parts=[types.Part.from_text(message)]))

        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        for chunk in resp:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"

    if GROQ_KEY:
        try:
            return StreamingResponse(stream_groq(), media_type="text/event-stream")
        except Exception:
            pass

    if GEMINI_KEY:
        return StreamingResponse(stream_gemini(), media_type="text/event-stream")

    raise HTTPException(status_code=500, detail="All AI models failed")

_pulse_cache = {}

@app.get("/ai/pulse/{slug}")
@limiter.limit("20/minute")
def ai_pulse(request: Request, slug: str):
    # Public kalmasi gerekiyor (coin sayfalarinda anonim kullaniciya da gosteriliyor)
    # ama slug basina 300sn cache + IP basina rate limit ile sinirlandirildi:
    # cache'i slug degistirerek asmak isteyen biri limite takilir.
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
                "model": GROQ_MODEL,
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


# ---------------------------------------------------------------------------
# BINANCE API SYNC
# ---------------------------------------------------------------------------
class BinanceSyncRequest(BaseModel):
    api_key: str
    api_secret: str

@app.post("/portfolio/binance-sync")
@limiter.limit("10/minute")
async def binance_sync(request: Request, req: BinanceSyncRequest, user: dict = Depends(verify_token)):
    """
    Kullanicinin gonderdigi API Key ve Secret ile Binance Spot bakiyelerini okur.
    CORS'u asmak ve secret'i guvenle kullanmak icin backend proxy gorevi gorur.

    Auth zorunlu: aksi halde bu endpoint sunucumuzu Binance'e karsi acik bir
    proxy'ye cevirir (bizim IP'mizden sinirsiz key denemesi yapilabilir).
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

# -----------------------
# SWAP ENDPOINTS
# -----------------------
@app.get("/api/swap/quote")
@limiter.limit("30/minute")
async def get_swap_quote(
    request: Request,
    sellToken: str,
    buyToken: str,
    sellAmount: str,
    user: dict = Depends(verify_token),
):
    """
    0x API üzerinden swap teklifi alir.
    API Key'i frontend yerine backend'de gizleyerek güvenliği saglar ve
    zorunlu komisyon (fee) parametrelerini ekler.

    Auth zorunlu: her cagri bizim 0x API kotamizdan dusuyor.
    """
    import os
    
    # Environment variables
    API_KEY = os.getenv("ZEROEX_API_KEY")
    FEE_RECIPIENT = os.getenv("TREASURY_ADDRESS", "0x0000000000000000000000000000000000000000")
    FEE_PERCENTAGE = os.getenv("FEE_PERCENTAGE", "0.005")

    # If no API key is configured (dev environment fallback), simulate the response structure
    if not API_KEY or API_KEY == "YOUR_0X_API_KEY_HERE":
        raise HTTPException(status_code=501, detail="0x API Key is not configured on the backend.")
        
    url = f"https://api.0x.org/swap/v1/quote?sellToken={sellToken}&buyToken={buyToken}&sellAmount={sellAmount}&feeRecipient={FEE_RECIPIENT}&buyTokenPercentageFee={FEE_PERCENTAGE}"
    headers = {
        "0x-api-key": API_KEY
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"0x API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/exchanges/sync")
@limiter.limit("10/minute")
async def api_exchange_sync(
    request: Request,
    req: ExchangeSyncRequest,
    user: dict = Depends(verify_token),
):
    # Auth zorunlu — binance-sync ile ayni gerekce: acik borsa proxy'si olmasin.
    return await sync_exchange_balance(req.exchange_id, req.api_key, req.secret, req.password)


@app.get("/market/news")
async def get_market_news():
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://min-api.cryptocompare.com/data/v2/news/?lang=EN")
            data = resp.json()
            if data.get("Data"):
                # Return the latest 5 news items
                news = [{"id": item["id"], "title": item["title"], "source": item["source_info"]["name"], "url": item["url"], "published_on": item["published_on"]} for item in data["Data"][:5]]
                return {"ok": True, "news": news}
            return {"ok": False, "news": []}
    except Exception as e:
        return {"ok": False, "news": [], "error": str(e)}


@app.post("/ai/analyze-portfolio")
def api_analyze_portfolio(payload: dict, user: dict = Depends(verify_token)):
    from backend.services.ai_analysis import analyze_portfolio
    portfolio_data = payload.get("portfolio", {})
    if not portfolio_data:
        return {"status": "error", "message": "No portfolio data provided."}
    
    analysis = analyze_portfolio(portfolio_data)
    return {"status": "success", "analysis": analysis}
