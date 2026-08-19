import urllib.request, json, os

api_key = 'alch_TtwZaO2k3r863N5q19ZZi'
base_url = f"https://eth-mainnet.g.alchemy.com/v2/{api_key}"
address = "0x0E2E2FCd96F2d1f345FeCEAbC096AfC8E73309a4"

req1 = urllib.request.Request(base_url, data=json.dumps({
    "id": 1,
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": [address, "latest"]
}).encode(), headers={"Content-Type": "application/json"})
res1 = urllib.request.urlopen(req1)
print("ETH Balance:", json.loads(res1.read()))

req2 = urllib.request.Request(base_url, data=json.dumps({
    "id": 1,
    "jsonrpc": "2.0",
    "method": "alchemy_getTokenBalances",
    "params": [address, "erc20"]
}).encode(), headers={"Content-Type": "application/json"})
res2 = urllib.request.urlopen(req2)
print("ERC20:", json.loads(res2.read()))
