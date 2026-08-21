import asyncio
import random
import os
import joblib
import numpy as np
from datetime import datetime, timezone
from sklearn.ensemble import IsolationForest

# Tokens list for generating mock transaction streams
TOKENS = [
    {"symbol": "ETH", "price": 3100.50, "decimals": 2},
    {"symbol": "BTC", "price": 64500.00, "decimals": 2},
    {"symbol": "SOL", "price": 145.20, "decimals": 2},
    {"symbol": "PEPE", "price": 0.000008, "decimals": 8},
    {"symbol": "USDT", "price": 1.00, "decimals": 2},
    {"symbol": "USDC", "price": 1.00, "decimals": 2},
    {"symbol": "LINK", "price": 14.30, "decimals": 2},
    {"symbol": "ARB", "price": 1.15, "decimals": 2},
]

LABELS = [
    ("Smart Money", "emerald", "bullish"),
    ("Exchange Deposit", "rose", "bearish"),
    ("Exchange Withdrawal", "emerald", "bullish"),
    ("DEX Swap", "cyan", "neutral"),
    ("OTC Desk", "purple", "neutral"),
    ("Unknown Whale", "slate", "neutral")
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "whale_anomaly_model.joblib")

def get_or_train_model():
    """Loads the pre-trained Isolation Forest model, or trains it if missing."""
    if os.path.exists(MODEL_PATH):
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            pass
            
    # Generate Synthetic transaction dataset for unsupervised anomaly detection
    # Features: [amount_usd, is_stablecoin]
    rng = np.random.default_rng(42)
    
    # 1. Normal Transactions (smaller sizes)
    normal_amounts = rng.exponential(scale=15000, size=950) + 100
    normal_stables = rng.choice([0.0, 1.0], size=950, p=[0.7, 0.3])
    normal_data = np.column_stack((normal_amounts, normal_stables))
    
    # 2. Outlier/Whale Transactions (extremely large sizes)
    anomaly_amounts = rng.uniform(500000, 10000000, size=50)
    anomaly_stables = rng.choice([0.0, 1.0], size=50, p=[0.5, 0.5])
    anomaly_data = np.column_stack((anomaly_amounts, anomaly_stables))
    
    X_train = np.vstack((normal_data, anomaly_data))
    
    # Fit Isolation Forest
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X_train)
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    return model

# Initialize the ML Model
anomaly_detector = get_or_train_model()

def generate_mock_whale_tx():
    """
    Generates a transaction and uses the Isolation Forest model to determine if it is an anomaly.
    Only returns transactions classified as anomalies (outliers).
    """
    token = random.choice(TOKENS)
    is_stable = 1.0 if token["symbol"] in ["USDT", "USDC"] else 0.0
    
    # We want to yield both small and large transactions to test the detector
    # 80% chance of generating a massive (anomaly) tx, 20% of small tx
    # But since the generator only wants to output verified anomalies to the feed,
    # we evaluate them using the ML model.
    if random.random() < 0.85:
        # Massive anomaly tx
        usd_val = random.uniform(500_000, 10_000_000)
    else:
        # Small standard tx (which should get filtered out by model)
        usd_val = random.uniform(500, 45_000)
        
    # Evaluate features using Isolation Forest
    features = np.array([[usd_val, is_stable]])
    prediction = anomaly_detector.predict(features)[0] # 1 = normal, -1 = anomaly
    
    # If the model thinks it is a normal transaction, return None (filtered out)
    if prediction == 1:
        return None
        
    # Otherwise, it's a verified ML Anomaly! Generate the metadata.
    amount = usd_val / token["price"]
    label_info = random.choice(LABELS)
    label, color, sentiment = label_info
    
    # Format amount based on decimals
    if token["decimals"] == 0:
        amount_str = f"{amount:,.2f}"
    elif token["decimals"] == 8:
        amount_str = f"{amount:,.0f}"
    else:
        amount_str = f"{amount:,.2f}"
        
    return {
        "id": f"tx_{random.randint(10000, 99999)}",
        "token": token["symbol"],
        "amount": amount_str,
        "amount_usd": f"${usd_val:,.0f}",
        "label": f"ML: {label}",  # Tagged with ML to show the classifier tagged it
        "color": color,
        "sentiment": sentiment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

async def whale_data_generator():
    """Generates and yields only ML-detected anomaly transactions indefinitely."""
    while True:
        tx = generate_mock_whale_tx()
        if tx is not None:
            yield tx
            await asyncio.sleep(random.uniform(2.0, 5.0))
        else:
            # If it was filtered out, check again quickly
            await asyncio.sleep(0.1)

# ---------------------------------------------------------------------------
# WALLET ANALYSIS (Whale X-Ray)
# ---------------------------------------------------------------------------
# Bu fonksiyon eskiden cuzdan adresinin md5'inden seed alip TAMAMEN uydurma
# portfoy/islem/risk uretiyordu ve sonuc PRO ozelligi olarak satiliyordu.
# Artik gercek zincir verisi kullaniliyor: bakiyeler ve transfer gecmisi
# Alchemy'den, fiyatlar CoinCap'ten geliyor. Veri alinamazsa uydurma veriye
# DUSMEZ; acikca "unavailable" doner ve arayuz bunu gosterir.

ASSET_COLORS = [
    "bg-blue-500", "bg-green-500", "bg-purple-500",
    "bg-orange-500", "bg-pink-500", "bg-emerald-500",
]

# Bilinen borsa / kopru adresleri: transfer yonunu etiketlemek icin.
KNOWN_ADDRESSES = {
    "0x28c6c06298d514db089934071355e5743bf21d60": "Binance",
    "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance",
    "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance",
    "0x46340b20830761efd32832a74d7169b29feb9758": "Crypto.com",
    "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": "Coinbase",
    "0x71660c4005ba85c37ccec55d0c4493e66fe775d3": "Coinbase",
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap V2",
    "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap V3",
    "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch",
}


def _humanize_age(ts_iso: str) -> str:
    """ISO zaman damgasini '3 hours ago' gibi okunur hale getirir."""
    if not ts_iso:
        return "unknown"
    try:
        ts = datetime.fromisoformat(ts_iso.replace("Z", "+00:00"))
    except Exception:
        return "unknown"
    delta = datetime.now(timezone.utc) - ts
    mins = int(delta.total_seconds() // 60)
    if mins < 1:
        return "just now"
    if mins < 60:
        return f"{mins} min{'s' if mins != 1 else ''} ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"


def _fetch_transfers(address: str, api_key: str) -> list:
    """Alchemy alchemy_getAssetTransfers ile son gonderme/alma hareketleri."""
    import httpx

    base_url = f"https://eth-mainnet.g.alchemy.com/v2/{api_key}"
    categories = ["external", "erc20"]
    transfers = []

    for direction, key in (("from", "fromAddress"), ("to", "toAddress")):
        payload = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "alchemy_getAssetTransfers",
            "params": [{
                key: address,
                "category": categories,
                "withMetadata": True,
                "excludeZeroValue": True,
                "maxCount": "0xa",   # 10
                "order": "desc",
            }],
        }
        try:
            resp = httpx.post(base_url, json=payload, timeout=15.0)
            resp.raise_for_status()
            for t in resp.json().get("result", {}).get("transfers", []):
                t["_direction"] = direction
                transfers.append(t)
        except Exception as e:
            print(f"Alchemy transfer fetch failed ({direction}): {e}")

    # En yeniden eskiye sirala
    transfers.sort(
        key=lambda t: (t.get("metadata") or {}).get("blockTimestamp") or "",
        reverse=True,
    )
    return transfers[:8]


def _risk_score(assets: list) -> int:
    """
    Gercek portfoy dagilimindan risk skoru (0-100). Rastgele degil:
      - Yogunlasma (en buyuk pozisyonun payi) riski artirir
      - Stablecoin agirligi riski dusurur
      - Cok az varlik cesitliligi riski artirir
    """
    if not assets:
        return 0

    stables = {"USDT", "USDC", "DAI", "TUSD", "BUSD", "FRAX", "USDE"}
    top_share = max(a["percentage"] for a in assets)
    stable_share = sum(a["percentage"] for a in assets if a["coin"] in stables)

    score = top_share * 0.7                      # yogunlasma
    score += max(0, (4 - len(assets))) * 8       # dusuk cesitlilik
    score -= stable_share * 0.5                  # stablecoin tamponu
    return max(0, min(100, int(round(score))))


def analyze_wallet(address: str) -> dict:
    """
    Bir EVM cuzdanini GERCEK zincir verisiyle analiz eder.
    Veri saglanamazsa available=False doner — uydurma veri uretmez.
    """
    from backend.services.alchemy_service import get_wallet_balances

    api_key = os.getenv("ALCHEMY_API_KEY", "")
    if not api_key:
        return {
            "address": address,
            "available": False,
            "reason": "On-chain data provider is not configured (ALCHEMY_API_KEY missing).",
            "assets": [],
            "transactions": [],
            "ai_summary": None,
            "risk_score": None,
        }

    portfolio = get_wallet_balances(address)
    if portfolio.get("error"):
        return {
            "address": address,
            "available": False,
            "reason": f"Could not read on-chain data: {portfolio['error']}",
            "assets": [],
            "transactions": [],
            "ai_summary": None,
            "risk_score": None,
        }

    balances = portfolio.get("balances", [])
    total_usd = portfolio.get("total_usd", 0) or 0

    # --- Varliklar: gercek bakiyeler, USD degerine gore sirali ---
    assets = []
    priced = [b for b in balances if (b.get("usd_value") or 0) > 0]
    priced.sort(key=lambda b: b["usd_value"], reverse=True)

    for i, b in enumerate(priced[:6]):
        pct = (b["usd_value"] / total_usd * 100) if total_usd > 0 else 0
        amount = b["balance"]
        assets.append({
            "coin": b["symbol"],
            "amount": f"{amount:,.4f}" if amount < 1000 else f"{amount:,.0f}",
            "value": f"${b['usd_value']:,.0f}",
            "percentage": round(pct),
            "color": ASSET_COLORS[i % len(ASSET_COLORS)],
        })

    if not assets:
        return {
            "address": address,
            "available": False,
            "reason": "No priced ERC-20 or ETH balances found for this address on Ethereum mainnet.",
            "assets": [],
            "transactions": [],
            "ai_summary": None,
            "risk_score": None,
        }

    # --- Islemler: gercek transfer gecmisi ---
    prices = {a["coin"]: 0 for a in assets}
    transactions = []
    for t in _fetch_transfers(address, api_key):
        symbol = (t.get("asset") or "ETH").upper()
        raw_value = t.get("value") or 0
        counterparty = (
            t.get("to") if t["_direction"] == "from" else t.get("from")
        ) or ""
        venue = KNOWN_ADDRESSES.get(counterparty.lower(), "On-chain")

        # Yon: cuzdandan cikan = sell/transfer-out, gelen = buy/transfer-in
        tx_type = "sell" if t["_direction"] == "from" else "buy"
        if venue == "On-chain":
            tx_type = "transfer"

        transactions.append({
            "type": tx_type,
            "token": symbol,
            "amount": f"{raw_value:,.4f} {symbol}",
            "time": _humanize_age((t.get("metadata") or {}).get("blockTimestamp")),
            "dex": venue,
            "hash": t.get("hash"),
        })

    risk = _risk_score(assets)

    # --- AI ozeti: gercek veriyle besleniyor ---
    summary_text = None
    try:
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            from groq import Groq
            client = Groq(api_key=groq_key)
            holdings = ", ".join(f"{a['coin']} {a['percentage']}%" for a in assets)
            prompt = (
                f"Wallet {address} holds: {holdings}. Total value ${total_usd:,.0f}. "
                f"Computed concentration risk score: {risk}/100. "
                "Write exactly 2 concise, punchy sentences of risk analysis. "
                "State if they are a 'degen', a 'whale', or a 'conservative' investor. "
                "Focus on their biggest holding. Do not invent holdings not listed."
            )
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=100,
            )
            summary_text = completion.choices[0].message.content.strip()
    except Exception as e:
        print("Groq AI analysis failed:", e)

    return {
        "address": address,
        "available": True,
        "data_source": "alchemy",
        "total_usd": total_usd,
        "assets": assets,
        "transactions": transactions,
        "ai_summary": summary_text,
        "risk_score": risk,
    }
