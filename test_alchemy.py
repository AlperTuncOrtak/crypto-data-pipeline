import asyncio, os, json
from backend.services.alchemy_service import get_wallet_balances

os.environ['ALCHEMY_API_KEY'] = 'alch_TtwZaO2k3r863N5q19ZZi'

def main():
    res = get_wallet_balances('0x0E2E2FCd96F2d1f345FeCEAbC096AfC8E73309a4')
    print(json.dumps(res, indent=2))

main()
