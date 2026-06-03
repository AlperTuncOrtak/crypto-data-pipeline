import urllib.request
try:
    response = urllib.request.urlopen("http://localhost:8000/ai/pulse/bitcoin")
    print("SUCCESS:", response.read().decode())
except Exception as e:
    print("ERROR:", e)
