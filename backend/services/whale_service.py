import asyncio
import random
from datetime import datetime, timezone

TOKENS = [
    {"symbol": "ETH", "price": 3100.50, "decimals": 0},
    {"symbol": "BTC", "price": 64500.00, "decimals": 0},
    {"symbol": "SOL", "price": 145.20, "decimals": 0},
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

def generate_mock_whale_tx():
    token = random.choice(TOKENS)
    # Generate an amount that makes the USD value > $500k
    min_usd = 500_000
    max_usd = 10_000_000
    usd_val = random.uniform(min_usd, max_usd)
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
        "label": label,
        "color": color,
        "sentiment": sentiment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

async def whale_data_generator():
    """Generates a new whale transaction every 1 to 5 seconds indefinitely."""
    while True:
        yield generate_mock_whale_tx()
        await asyncio.sleep(random.uniform(1.0, 5.0))

import hashlib
import os
from groq import Groq

def analyze_wallet(address: str) -> dict:
    """Generates a deterministic but realistic portfolio and AI risk analysis for a wallet address."""
    # Create a stable random seed from the address
    seed_str = address.lower().strip()
    seed_int = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed_int)
    
    # Generate 3 to 6 assets
    num_assets = rng.randint(3, 6)
    shuffled_tokens = list(TOKENS)
    rng.shuffle(shuffled_tokens)
    
    assets = []
    total_percentage = 100
    
    colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-emerald-500"]
    rng.shuffle(colors)
    
    for i in range(num_assets):
        token = shuffled_tokens[i]
        
        if i == num_assets - 1:
            pct = total_percentage
        else:
            pct = rng.randint(5, max(10, total_percentage - (num_assets - i - 1) * 5))
            total_percentage -= pct
            
        usd_value = rng.uniform(10_000, 5_000_000) * (pct / 100)
        amount = usd_value / token["price"]
        
        assets.append({
            "coin": token["symbol"],
            "amount": f"{amount:,.2f}" if token["decimals"] == 0 else f"{amount:,.0f}",
            "value": f"${usd_value:,.0f}",
            "percentage": pct,
            "color": colors[i]
        })
        
    assets.sort(key=lambda x: x["percentage"], reverse=True)
    
    # Generate 4 recent transactions
    tx_types = ["buy", "sell", "transfer", "swap"]
    dexes = ["Uniswap", "Raydium", "1inch", "Binance", "Jupiter"]
    
    transactions = []
    for _ in range(4):
        tx_type = rng.choice(tx_types)
        token = rng.choice(assets)["coin"]
        dex = rng.choice(dexes)
        
        # random time
        time_str = rng.choice(["2 mins ago", "1 hour ago", "12 hours ago", "1 day ago", "3 days ago"])
        
        # random amount
        tx_usd = rng.uniform(5000, 500_000)
        
        transactions.append({
            "type": tx_type,
            "token": token,
            "amount": f"${tx_usd:,.0f}",
            "time": time_str,
            "dex": dex
        })
        
    # AI Risk Summary (Simulated via Groq if key exists, else fallback)
    summary_text = "This wallet shows a balanced approach with moderate risk. Concentration in large caps suggests a conservative strategy, though recent DEX activity indicates some yield-seeking behavior."
    
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            client = Groq(api_key=api_key)
            prompt = f"Analyze this crypto portfolio for wallet {address}: {assets}. Write exactly 2 concise, punchy sentences of risk analysis. State if they are a 'degen', a 'whale', or a 'conservative' investor. Focus on their biggest holding."
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=100,
            )
            summary_text = completion.choices[0].message.content.strip()
    except Exception as e:
        print("Groq AI analysis failed, using fallback.", e)

    return {
        "address": address,
        "assets": assets,
        "transactions": transactions,
        "ai_summary": summary_text,
        "risk_score": rng.randint(10, 90)
    }

import os
import joblib

def get_ml_anomalies(symbol: str = None, limit: int = 10):
    """
    Fetches real ML anomalies by querying the latest features from PostgreSQL 
    and passing them through the trained Isolation Forest model.
    """
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
    
    try:
        from data_pipeline.ml.feature_extractor import CryptoFeatureExtractor
    except ImportError:
        print("Could not import CryptoFeatureExtractor.")
        return []
        
    model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data_pipeline', 'ml', 'models', 'isolation_forest.pkl')
    
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Please run train_model.py first.")
        return []
        
    try:
        model = joblib.load(model_path)
    except Exception as e:
        print(f"Failed to load ML model: {e}")
        return []

    target_symbol = symbol or 'btcusdt'
    
    # We fetch a slightly larger window to compute rolling features properly
    extractor = CryptoFeatureExtractor()
    dataset = extractor.get_training_dataset(symbol=target_symbol, hours_back=2)
    
    if dataset.empty:
        return []
        
    # Get the most recent records
    recent_data = dataset.tail(limit)
    
    # Predict (-1 for anomaly, 1 for normal)
    predictions = model.predict(recent_data)
    scores = model.decision_function(recent_data)
    
    anomalies = []
    
    for i, (idx, row) in enumerate(recent_data.iterrows()):
        is_anomaly = predictions[i] == -1
        if is_anomaly:
            # Reconstruct original features for display if needed, but we only have rolling features in dataset
            anomalies.append({
                "symbol": target_symbol.upper(),
                "timestamp": idx.isoformat(),
                "vwap_roc_5m": f"{row['vwap_roc_5m']*100:.2f}%",
                "volume_spike_ratio": f"{row['volume_spike_ratio']:.2f}x",
                "score": float(scores[i]),
                "severity": "CRITICAL" if scores[i] < -0.1 else "WARNING"
            })
            
    # Sort by timestamp descending
    anomalies.reverse()
    return anomalies

