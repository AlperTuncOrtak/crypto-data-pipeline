import urllib.request
import json

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_GROQ_API_KEY_HERE",
    "Content-Type": "application/json"
}
data = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "system", "content": "You are a sharp crypto analyst."},
        {"role": "user", "content": "Analyze why Bitcoin (BTC) is moving right now. Current price: $68500.50, 24h change: +4.25%, 24h volume: $35000000000. Write strictly 1 or 2 short, punchy sentences explaining the probable cause or context of this movement (e.g., volume surge, market trend, anomaly). No generic filler."}
    ],
    "max_tokens": 150,
    "temperature": 0.5
}
req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode("utf-8"))
response = urllib.request.urlopen(req)
print(json.loads(response.read().decode("utf-8"))["choices"][0]["message"]["content"])
