import asyncio
import random
import os
import joblib
import numpy as np
import hashlib
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

def analyze_wallet(address: str) -> dict:
    """Generates a deterministic but realistic portfolio and AI risk analysis for a wallet address."""
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
        
        time_str = rng.choice(["2 mins ago", "1 hour ago", "12 hours ago", "1 day ago", "3 days ago"])
        tx_usd = rng.uniform(5000, 500_000)
        
        transactions.append({
            "type": tx_type,
            "token": token,
            "amount": f"${tx_usd:,.0f}",
            "time": time_str,
            "dex": dex
        })
        
    summary_text = "This wallet shows a balanced approach with moderate risk. Concentration in large caps suggests a conservative strategy, though recent DEX activity indicates some yield-seeking behavior."
    
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            from groq import Groq
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
