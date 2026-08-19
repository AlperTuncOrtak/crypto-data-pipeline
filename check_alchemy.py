import os, json, urllib.request

address = "0x0E2E2FCd96F2d1f345FeCEAbC096AfC8E73309a4"
req = urllib.request.Request(
    "https://cloudflare-eth.com",
    data=json.dumps({"jsonrpc":"2.0","method":"eth_getBalance","params":[address, "latest"],"id":1}).encode(),
    headers={"Content-Type": "application/json"}
)
res = urllib.request.urlopen(req)
print(json.loads(res.read()))
