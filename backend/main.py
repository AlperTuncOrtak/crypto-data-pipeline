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

from fastapi import FastAPI, Query, HTTPException
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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
# DB TEST
# -----------------------
# DB baglantisini test etmek icin - production'da kaldirilabilir.
@app.get("/test-db")
def test_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return {"db": result}


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
def analysis_history(symbols: list[str] = Query(...)):
    """Secili coinlerin fiyat gecmisi (chart icin)."""
    return get_multi_coin_history(symbols)


@app.get("/analysis/performance")
def analysis_performance(symbols: list[str] = Query(...)):
    """Secili coinlerin toplam getirisi (karsilastirma tablosu icin)."""
    return get_multi_coin_performance(symbols)

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
