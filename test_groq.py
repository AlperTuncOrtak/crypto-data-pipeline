import os
import httpx
from dotenv import load_dotenv

load_dotenv('backend/.env')
GROQ_KEY = os.getenv('GROQ_API_KEY')

name = 'Bitcoin'
symbol = 'BTC'
price = 68500.50
change = 4.25
vol = 35000000000

prompt = f"Analyze why {name} ({symbol}) is moving right now. Current price: ${price}, 24h change: {change:+.2f}%, 24h volume: ${vol:,.0f}. Write strictly 1 or 2 short, punchy sentences explaining the probable cause or context of this movement (e.g., volume surge, market trend, anomaly). No generic filler."

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
print("AI Analysis Output:", resp.json()["choices"][0]["message"]["content"].strip())
