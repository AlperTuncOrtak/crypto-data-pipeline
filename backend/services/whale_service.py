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
