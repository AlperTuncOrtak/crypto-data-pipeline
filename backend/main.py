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
from backend.redis_client import REDIS_URL

if REDIS_URL:
    limiter = Limiter(key_func=get_remote_address, storage_uri=REDIS_URL)
else:
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

from backend.routers import whale, stripe_router, wallet, copy

app.include_router(whale.router)
app.include_router(stripe_router.router)
# Eski "/webhook" yolu: Stripe Dashboard'daki kayitli URL degistirilene kadar
# ayni handler'a bagli kalmali, yoksa gelen odeme event'leri 404 alir.
app.include_router(stripe_router.legacy_router)
app.include_router(wallet.router)
app.include_router(copy.router)


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


import asyncio
import json as _json

@app.get("/market/stream")
async def market_stream(request: Request, limit: int = 100):
    """SSE endpoint — her 3 saniyede Redis'ten fiyat snapshot'i iter.
    Frontend EventSource ile baglanir, polling'e gerek kalmaz."""
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            try:
                data = get_latest_market(limit)
                yield f"data: {_json.dumps(data)}\n\n"
            except Exception:
                pass
            await asyncio.sleep(3)

    from fastapi.responses import StreamingResponse as _SR
    return _SR(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


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


# Sektor haritasi — deterministik metrikler ve prompt icin ortak kaynak.
PORTFOLIO_SECTORS = {
    "BTC": "Store of Value",
    "ETH": "Layer 1", "SOL": "Layer 1", "ADA": "Layer 1", "AVAX": "Layer 1",
    "NEAR": "Layer 1", "APT": "Layer 1", "SUI": "Layer 1", "TON": "Layer 1",
    "DOT": "Layer 0", "ATOM": "Layer 0",
    "MATIC": "Layer 2", "ARB": "Layer 2", "OP": "Layer 2", "IMX": "Layer 2", "STRK": "Layer 2",
    "BNB": "Exchange Token", "OKB": "Exchange Token", "CRO": "Exchange Token",
    "XRP": "Payments", "LTC": "Payments", "BCH": "Payments", "XLM": "Payments",
    "LINK": "Oracle", "PYTH": "Oracle",
    "UNI": "DeFi", "AAVE": "DeFi", "MKR": "DeFi", "CRV": "DeFi", "LDO": "DeFi", "SNX": "DeFi",
    "DOGE": "Meme", "SHIB": "Meme", "PEPE": "Meme", "WIF": "Meme", "BONK": "Meme", "FLOKI": "Meme",
    "FIL": "Storage", "AR": "Storage",
    "ICP": "Web3", "GRT": "Web3", "RENDER": "Web3",
    "VET": "Enterprise",
    "USDT": "Stablecoin", "USDC": "Stablecoin", "DAI": "Stablecoin",
    "BUSD": "Stablecoin", "TUSD": "Stablecoin", "FDUSD": "Stablecoin", "USDP": "Stablecoin",
}

STABLE_SYMBOLS = {k for k, v in PORTFOLIO_SECTORS.items() if v == "Stablecoin"}


def _parse_ts(value) -> "datetime":
    """
    Supabase timestamp'ini datetime'a cevir.

    Postgres kesirli saniyedeki sondaki sifirlari atiyor, yani
    "…:41.60065+00:00" gibi 5 haneli degerler geliyor. Python 3.10'un
    fromisoformat'i sadece 3 veya 6 hane kabul edip ValueError atiyor
    (3.11+ esnek). Hane sayisini 6'ya tamamliyoruz.
    """
    import re
    from datetime import datetime

    text = str(value).replace("Z", "+00:00")
    text = re.sub(
        r"\.(\d{1,6})",
        lambda m: "." + m.group(1).ljust(6, "0"),
        text,
        count=1,
    )
    return datetime.fromisoformat(text)


def _portfolio_history(user_id: str, days: int = 90):
    """
    Kaydedilmis portfoy degerlerinden performans ozeti.

    Analiz bugune kadar anlik fotograf goruyordu: portfoyun zaman icinde ne
    yaptigini bilmeden "riskini azalt" diyordu. portfolio_snapshots artik
    doluyor, o yuzden gecmisi de veriyoruz.

    En az iki nokta yoksa None doner — tek olcumden performans cikarilmaz.
    """
    from datetime import datetime, timezone, timedelta

    try:
        sb = _snapshot_client()
        since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        rows = (
            sb.table("portfolio_snapshots")
            .select("captured_at,total_value")
            .eq("user_id", user_id)
            .gte("captured_at", since)
            .order("captured_at", desc=False)
            .limit(2000)
            .execute()
        ).data or []
    except Exception as e:
        print(f"[ai] snapshot history lookup failed: {e}")
        return None

    values = [float(r["total_value"]) for r in rows if r.get("total_value") is not None]
    if len(values) < 2:
        return None

    first, last = values[0], values[-1]

    # En buyuk tepe-dip dususu: riskin gecmiste fiilen ne kadar acidigi.
    peak = values[0]
    max_drawdown = 0.0
    for v in values:
        peak = max(peak, v)
        if peak > 0:
            max_drawdown = max(max_drawdown, (peak - v) / peak * 100)

    start = _parse_ts(rows[0]["captured_at"])
    end = _parse_ts(rows[-1]["captured_at"])
    hours = max((end - start).total_seconds() / 3600, 0)

    return {
        "points": len(values),
        "hours_tracked": round(hours, 1),
        "change_pct": round((last - first) / first * 100, 2) if first > 0 else 0.0,
        "max_drawdown_pct": round(max_drawdown, 2),
        "first_value": round(first, 2),
        "last_value": round(last, 2),
    }


def _measured_correlation(positions: list):
    """
    Portfoyun agirlikli ortalama ikili korelasyonu — gercek fiyat gecmisinden.

    Onceden bu "stablecoin disi oran > %70 ise high" seklinde tahmin ediliyordu,
    yani iki L1 mi yoksa birbiriyle alakasiz iki sektor mu tuttugunu ayirt
    edemiyordu. get_correlation_matrix zaten price_history uzerinden Pearson
    hesapliyordu ve hic kullanilmiyordu.

    Yeterli veri yoksa None doner; cagiran taraf tahmine geri duser.
    """
    volatile = [p for p in positions if p["symbol"] not in STABLE_SYMBOLS]
    if len(volatile) < 2:
        return None

    try:
        # 7 gun: 24 saat cok az bucket birakiyor ve korelasyon zipliyor.
        pairs = get_correlation_matrix([p["symbol"] for p in volatile], hours=168)
    except Exception as e:
        print(f"[ai] correlation lookup failed: {e}")
        return None

    if not pairs:
        return None

    weights = {p["symbol"]: p["weight"] for p in volatile}
    num = den = 0.0
    for row in pairs:
        a, b = row["symbol_a"], row["symbol_b"]
        # Matris her ciftin iki yonunu ve kosegeni de veriyor; birini al.
        if a >= b:
            continue
        w = weights.get(a, 0) * weights.get(b, 0)
        num += w * row["correlation"]
        den += w

    return round(num / den, 3) if den > 0 else None


def _portfolio_metrics(holdings: list, total_value: float) -> dict:
    """
    Portfoy risk metriklerini deterministik hesapla.

    Bunlar bilerek LLM'e birakilmiyor: dil modelleri aritmetikte guvenilmez ve
    "risk skoru 7" gibi bir sayiyi uydurmasi, kullanicinin gercek sandigi bir
    rakam uretmesi demek. Model sadece bu sayilari YORUMLUYOR.
    """
    total = max(total_value, 1e-9)

    positions = []
    for h in holdings:
        value = float(h.get("value") or 0)
        if value <= 0:
            continue
        symbol = str(h.get("symbol", "")).upper()
        positions.append({
            "symbol": symbol,
            "value": value,
            "weight": value / total * 100,
            "sector": PORTFOLIO_SECTORS.get(symbol, "Other"),
            "pnl_pct": float(h.get("pnl_pct") or 0),
        })

    positions.sort(key=lambda p: p["value"], reverse=True)

    def share(predicate) -> float:
        return sum(p["weight"] for p in positions if predicate(p))

    stable_pct = share(lambda p: p["symbol"] in STABLE_SYMBOLS)
    meme_pct = share(lambda p: p["sector"] == "Meme")
    btc_pct = share(lambda p: p["symbol"] == "BTC")
    eth_pct = share(lambda p: p["symbol"] == "ETH")
    # Blue chip ve stable disi her sey; volatilitenin asil kaynagi.
    alt_pct = share(lambda p: p["symbol"] not in STABLE_SYMBOLS and p["symbol"] not in ("BTC", "ETH"))
    top_pct = positions[0]["weight"] if positions else 0.0

    # Herfindahl-Hirschman yogunlasma endeksi. 1/HHI = "kac esit agirlikli
    # pozisyona denk" — 3 coin'in %90'i tek coin'deyse bu 1'e yaklasir.
    hhi = sum((p["weight"] / 100) ** 2 for p in positions)
    effective_positions = (1 / hhi) if hhi > 0 else 0

    sectors: dict = {}
    for p in positions:
        sectors[p["sector"]] = sectors.get(p["sector"], 0) + p["weight"]
    sector_breakdown = {k: round(v, 1) for k, v in sorted(sectors.items(), key=lambda kv: -kv[1])}
    dominant_sector = next(iter(sector_breakdown), "None")

    # Cesitlendirme: hem kac etkin pozisyon var, hem kac farkli sektor.
    # Olcekler 1'den basliyor: tek pozisyonlu / tek sektorlu bir portfoy
    # cesitlendirmeden sifir puan almali. Oranlari dogrudan bolersek
    # (eff/6) tek coin'e bile kismi puan verip 3/10 gibi yaniltici bir
    # skor uretiyordu.
    non_stable_sectors = len([k for k in sectors if k != "Stablecoin"])
    pos_component = min(max(effective_positions - 1, 0) / 5, 1)
    sector_component = min(max(non_stable_sectors - 1, 0) / 3, 1)
    div_raw = 0.6 * pos_component + 0.4 * sector_component
    diversification_score = max(1, min(10, round(1 + div_raw * 9)))

    # Risk: yogunlasma + meme + altcoin agirligi, stablecoin tamponuyla dusuyor.
    risk_raw = (
        (top_pct / 100) * 3
        + (meme_pct / 100) * 3
        + (alt_pct / 100) * 2
        - (stable_pct / 100) * 2
        + (1 if len(positions) < 3 else 0)
    )
    risk_score = max(1, min(10, round(risk_raw)))
    risk_label = (
        "Low" if risk_score <= 3 else
        "Medium" if risk_score <= 5 else
        "High" if risk_score <= 7 else
        "Very High"
    )

    # Kripto varliklarin cogu BTC ile yuksek korelasyonlu; asil dengeleyici stablecoin.
    measured = _measured_correlation(positions)
    if measured is not None:
        correlation_value = measured
        correlation_source = "measured"
        correlation_risk = "high" if measured >= 0.7 else "medium" if measured >= 0.4 else "low"
    else:
        # Esikler bilerek dusuk: portfoyun yarisi tek bir volatil varliktaysa
        # bunu "dusuk korelasyon riski" diye etiketlemek gercegi hafifletir.
        non_stable = 100 - stable_pct
        correlation_value = None
        correlation_source = "estimated"
        correlation_risk = "high" if non_stable >= 70 else "medium" if non_stable >= 40 else "low"

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "diversification_score": diversification_score,
        "dominant_sector": dominant_sector,
        "sector_breakdown": sector_breakdown,
        "correlation_risk": correlation_risk,
        "correlation_value": correlation_value,
        "correlation_source": correlation_source,
        "concentration_pct": round(top_pct, 1),
        "effective_positions": round(effective_positions, 2),
        "stablecoin_pct": round(stable_pct, 1),
        "meme_pct": round(meme_pct, 1),
        "btc_pct": round(btc_pct, 1),
        "eth_pct": round(eth_pct, 1),
        "altcoin_pct": round(alt_pct, 1),
        "position_count": len(positions),
        "positions": positions,
    }


@app.post("/ai/portfolio")
@limiter.limit("10/minute")
def ai_portfolio_analyze(request: Request, payload: dict, user: dict = Depends(verify_token)):
    """
    Portfoy analizi — sayilar deterministik, yorum LLM'den (Groq → Gemini).

    Body: { holdings: [{symbol, value, pnl_pct, quantity, avg_cost}],
            total_value, total_pnl, has_cost_basis?, realized_ytd? }

    Auth zorunlu: her cagri ucretli LLM API'sine gidiyor.
    """
    import os, json, httpx

    holdings = payload.get("holdings", [])
    total_value = float(payload.get("total_value") or 0)
    total_pnl = float(payload.get("total_pnl") or 0)
    has_cost_basis = bool(payload.get("has_cost_basis"))
    realized_ytd = payload.get("realized_ytd")

    if not holdings or total_value <= 0:
        return {
            "ai_available": False,
            "empty": True,
            "risk_score": 0,
            "risk_label": "N/A",
            "diversification_score": 0,
            "dominant_sector": "None",
            "sector_breakdown": {},
            "correlation_risk": "low",
            "concentration_pct": 0,
            "effective_positions": 0,
            "stablecoin_pct": 0,
            "position_count": 0,
            "summary": "There is nothing to analyse yet. Connect a wallet, sync an exchange, or import a CSV and the engine will assess concentration, sector exposure and risk.",
            "recommendations": ["Connect an on-chain wallet or exchange to begin tracking your assets."],
            "strengths": [],
            "risks": [],
            "best_position": None,
            "worst_position": None,
        }

    m = _portfolio_metrics(holdings, total_value)
    positions = m.pop("positions")
    m["history"] = _portfolio_history(user["id"])

    GROQ_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

    total_pnl_pct = (total_pnl / max(total_value, 1e-9)) * 100
    best = max(positions, key=lambda p: p["pnl_pct"], default=None) if has_cost_basis else None
    worst = min(positions, key=lambda p: p["pnl_pct"], default=None) if has_cost_basis else None

    holdings_text = "\n".join(
        f"- {p['symbol']} ({p['sector']}): ${p['value']:.2f}, {p['weight']:.1f}% of portfolio"
        + (f", P&L {p['pnl_pct']:+.2f}%" if has_cost_basis else "")
        for p in positions[:12]
    )

    pnl_line = (
        f"Unrealized P&L: ${total_pnl:+.2f} ({total_pnl_pct:+.1f}%)"
        if has_cost_basis
        else "Unrealized P&L: unknown — no trade history imported, holdings are marked to market."
    )
    realized_line = f"\nRealized gains this year: ${float(realized_ytd):+.2f}" if realized_ytd is not None else ""
    h = m.get("history")
    history_line = (
        "\nTracked history: {points} recorded snapshots over {hours:.0f}h — value moved "
        "{change:+.2f}% (${first:.2f} -> ${last:.2f}), worst peak-to-trough drop {dd:.2f}%.".format(
            points=h["points"], hours=h["hours_tracked"], change=h["change_pct"],
            first=h["first_value"], last=h["last_value"], dd=h["max_drawdown_pct"],
        )
        if h
        else "\nTracked history: none yet — this is the first look at the portfolio, so say nothing about past performance."
    )
    corr_line = (
        f" (measured: average pairwise correlation {m['correlation_value']:.2f} over the last 7 days)"
        if m["correlation_source"] == "measured"
        else " (estimated from stablecoin share — not enough price history to measure)"
    )

    prompt = f"""You are a professional crypto portfolio risk analyst.

The metrics below are ALREADY CALCULATED and correct. Do NOT recalculate or contradict them.
Your job is interpretation and advice, not arithmetic.

PORTFOLIO
Total value: ${total_value:.2f}
{pnl_line}{realized_line}
Positions: {m['position_count']}{history_line}

CALCULATED METRICS
Risk score: {m['risk_score']}/10 ({m['risk_label']})
Diversification score: {m['diversification_score']}/10
Largest position: {m['concentration_pct']:.1f}% of the portfolio
Effective positions (1/HHI): {m['effective_positions']:.2f} — equivalent number of equally weighted holdings
Stablecoin buffer: {m['stablecoin_pct']:.1f}%
BTC: {m['btc_pct']:.1f}% | ETH: {m['eth_pct']:.1f}% | Other alts: {m['altcoin_pct']:.1f}% | Memecoins: {m['meme_pct']:.1f}%
Correlation risk: {m['correlation_risk']}{corr_line}
Dominant sector: {m['dominant_sector']}
Sector breakdown: {json.dumps(m['sector_breakdown'])}

HOLDINGS
{holdings_text}

Respond ONLY with valid JSON, no markdown fences:
{{
  "summary": "<3-4 sentences interpreting the metrics above. Reference the actual numbers. Say plainly what kind of portfolio this is and what would hurt it most.>",
  "strengths": ["<specific, tied to a number above>", "<second>", "<third if warranted>"],
  "risks": ["<specific, tied to a number above>", "<second>", "<third if warranted>"],
  "recommendations": ["<concrete action with a target % or asset>", "<second>", "<third>"],
  "best_position": "<symbol — one short sentence on what to do with it, or null>",
  "worst_position": "<symbol — one short sentence on what to do with it, or null>"
}}

RULES
- Never invent numbers that contradict the calculated metrics.
- Per-holding P&L figures are PERCENTAGES. Never render them with a currency
  symbol; "+55.47%" must never be written as "+$55.47".
- A tiny portfolio (under $100) is normal for someone starting out — do not lecture about position sizing being 'too small to matter'; focus on structure instead.
- If P&L is unknown, do not speculate about profit or loss; recommend importing trade history instead.
- Be direct and concrete. No filler, no disclaimers about being an AI.
- English only."""

    def try_groq():
        resp = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "You are a professional crypto portfolio risk analyst. Respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1200,
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

    narrative = None
    for attempt in (try_groq if GROQ_KEY else None, try_gemini if GEMINI_KEY else None):
        if attempt is None or narrative is not None:
            continue
        try:
            narrative = attempt()
        except Exception as e:
            print(f"Portfolio AI attempt failed: {e}")

    # LLM erisilemese bile hesaplanan metrikler gecerli. Eskiden burada 500
    # atiliyordu ve kullanici hicbir sey goremiyordu; artik sayilar donuyor,
    # sadece yorum eksik kaliyor ve bunu ai_available ile bildiriyoruz.
    if narrative is None:
        return {
            **m,
            "ai_available": False,
            "summary": None,
            "strengths": [],
            "risks": [],
            "recommendations": [],
            "best_position": best["symbol"] if best else None,
            "worst_position": worst["symbol"] if worst else None,
        }

    def as_list(v):
        if isinstance(v, list):
            return [str(x) for x in v if x]
        return [str(v)] if v else []

    return {
        **m,
        "ai_available": True,
        "summary": narrative.get("summary"),
        "strengths": as_list(narrative.get("strengths")),
        "risks": as_list(narrative.get("risks")),
        "recommendations": as_list(narrative.get("recommendations")),
        "best_position": narrative.get("best_position") or (best["symbol"] if best else None),
        "worst_position": narrative.get("worst_position") or (worst["symbol"] if worst else None),
    }


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

from backend.redis_client import cache_get, cache_set

@app.get("/ai/pulse/{slug}")
@limiter.limit("20/minute")
def ai_pulse(request: Request, slug: str):
    # Public kalmasi gerekiyor ama Redis uzerinden distributed cache + IP rate limit ile sinirlandirildi
    import time, os, httpx
    from backend.services.coin_service import get_coin_by_slug
    
    cache_key = f"pulse:{slug}"
    cached_pulse = cache_get(cache_key)
    if cached_pulse:
        return {"pulse": cached_pulse}
        
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
        
    cache_set(cache_key, reply, ttl_seconds=300)
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

# ── Portfoy anlik goruntuleri ────────────────────────────────
# Grafik eskiden gecmis fiyatlari BUGUNKU miktarlarla carpiyordu, yani
# gercek gecmisi degil "bugunku varliklarim o gun ne ederdi"yi ciziyordu.
# Gercek gecmis ancak kaydedilerek olusur; asagisi o kaydi tutuyor.

SNAPSHOT_MIN_INTERVAL_MINUTES = 60
# Uydurma/bozuk bir toplamin gecmise yazilmasini engelleyen ust sinir.
SNAPSHOT_MAX_VALUE = 1e12


def _snapshot_client():
    # Bu modulde `os` yalnizca `_os` takma adiyla import edilmis; duz `os`
    # modul seviyesinde tanimli degil.
    import os
    from supabase import create_client

    url = os.getenv("VITE_SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return create_client(url, key)


@app.post("/portfolio/snapshot")
@limiter.limit("30/minute")
def portfolio_snapshot_write(request: Request, payload: dict, user: dict = Depends(verify_token)):
    """
    Portfoyun o anki toplam degerini kaydeder.

    Saatte bir kayittan fazlasi yazilmaz: sayfa her acildiginda satir
    eklemek grafigi ziplatir ve tabloyu sisirir.
    """
    from datetime import datetime, timezone, timedelta

    try:
        total_value = float(payload.get("total_value"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="total_value must be a number")

    if not (total_value == total_value) or total_value in (float("inf"), float("-inf")):
        raise HTTPException(status_code=400, detail="total_value must be finite")
    if total_value < 0 or total_value > SNAPSHOT_MAX_VALUE:
        raise HTTPException(status_code=400, detail="total_value out of range")

    holdings = payload.get("holdings") or []
    if not isinstance(holdings, list):
        raise HTTPException(status_code=400, detail="holdings must be a list")

    # Sadece ihtiyac duyulan alanlari sakla; istemciden gelen her seyi degil.
    slim = [
        {
            "symbol": str(h.get("symbol", ""))[:20],
            "quantity": float(h.get("quantity") or 0),
            "value": float(h.get("value") or 0),
        }
        for h in holdings[:100]
        if isinstance(h, dict) and h.get("symbol")
    ]

    sb = _snapshot_client()
    now = datetime.now(timezone.utc)

    latest = (
        sb.table("portfolio_snapshots")
        .select("captured_at")
        .eq("user_id", user["id"])
        .order("captured_at", desc=True)
        .limit(1)
        .execute()
    )

    if latest.data:
        last_at = _parse_ts(latest.data[0]["captured_at"])
        if now - last_at < timedelta(minutes=SNAPSHOT_MIN_INTERVAL_MINUTES):
            return {"ok": True, "written": False, "reason": "throttled"}

    sb.table("portfolio_snapshots").insert(
        {
            "user_id": user["id"],
            "total_value": total_value,
            "holdings": slim,
            "captured_at": now.isoformat(),
        }
    ).execute()

    return {"ok": True, "written": True, "captured_at": now.isoformat()}


@app.get("/portfolio/snapshots")
@limiter.limit("60/minute")
def portfolio_snapshot_read(request: Request, days: int = 30, user: dict = Depends(verify_token)):
    """Kaydedilmis portfoy degerleri — eskiden yeniye."""
    from datetime import datetime, timezone, timedelta

    days = max(1, min(days, 1825))
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    sb = _snapshot_client()
    result = (
        sb.table("portfolio_snapshots")
        .select("captured_at,total_value")
        .eq("user_id", user["id"])
        .gte("captured_at", since)
        .order("captured_at", desc=False)
        .limit(2000)
        .execute()
    )

    return {
        "snapshots": [
            {"time": r["captured_at"], "value": float(r["total_value"])}
            for r in (result.data or [])
        ]
    }


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
@limiter.limit("30/minute")
def get_market_news(request: Request, symbol: str = None):
    """
    Kripto haber akisi — Cointelegraph / CoinDesk / Decrypt RSS'lerinden.

    Bu endpoint'in var olma sebebi: haber kaynaklari CORS basligi
    gondermiyor, yani tarayicidan dogrudan cagrilamiyor.

    Eskiden CryptoCompare'e proxy yapiyordu. CryptoCompare (artik CoinDesk
    Data) API anahtari zorunlu kildi ve anahtar olmadan
    {"Data":{},"Err":{"message":"API key required"...}} donmeye basladi.
    Kod bunu `data.get("Data") or []` ile yutuyordu, yani her istek
    "haber yok" gibi gorunuyordu. Projede zaten anahtar gerektirmeyen
    RSS tabanli news_service vardi; artik onu kullaniyoruz.

    symbol verilirse o coin'e ait haberler, verilmezse genel akis doner.
    """
    from backend.services.news_service import get_coin_news, get_latest_news

    try:
        if symbol:
            # RSS basliklari sembolu degil ismi kullaniyor (BTC yerine Bitcoin),
            # o yuzden once ismi cozuyoruz.
            from backend.services.coin_service import get_coin_name_by_symbol

            coin_name = get_coin_name_by_symbol(symbol) or symbol
            items = get_coin_news(coin_name, symbol, max_results=5)
        else:
            items = get_latest_news(max_results=5)
    except Exception as e:
        # Kaynaklara ulasilamadi — bunu "haber yok" diye gostermek yanlis olur.
        print(f"News fetch failed (symbol={symbol}): {e}")
        return {"ok": False, "news": [], "error": "News sources are unavailable right now."}

    news = [
        {
            # RSS'te stabil bir id yok; link tekil oldugu icin onu kullaniyoruz.
            "id": item.get("url") or item.get("title"),
            "title": item.get("title"),
            "body": item.get("body", ""),
            "source": item.get("source"),
            "url": item.get("url"),
            "imageurl": item.get("imageurl"),
            # Frontend published_on'u saniye cinsinden bekliyor (new Date(x * 1000)).
            "published_on": int(item["timestamp"]) if item.get("timestamp") else None,
        }
        for item in items
    ]

    return {"ok": True, "news": news}


@app.post("/ai/analyze-portfolio")
def api_analyze_portfolio(payload: dict, user: dict = Depends(verify_token)):
    from backend.services.ai_analysis import analyze_portfolio
    portfolio_data = payload.get("portfolio", {})
    if not portfolio_data:
        return {"status": "error", "message": "No portfolio data provided."}
    
    analysis = analyze_portfolio(portfolio_data)
    return {"status": "success", "analysis": analysis}
