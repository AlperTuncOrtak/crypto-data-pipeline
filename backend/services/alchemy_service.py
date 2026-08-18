import os
import httpx
from typing import List, Dict, Any

def get_wallet_balances(wallet_address: str) -> Dict[str, Any]:
    """
    Fetches the ERC20 token balances and transaction history for a given wallet address using Alchemy API.
    Returns formatted portfolio data.
    """
    alchemy_api_key = os.getenv("ALCHEMY_API_KEY", "")
    
    if not alchemy_api_key:
        return {"balances": [], "total_usd": 0, "error": "ALCHEMY_API_KEY is not configured"}
        
    base_url = f"https://eth-mainnet.g.alchemy.com/v2/{alchemy_api_key}"
    
    try:
        # 1. Token bakiyelerini cek
        balance_payload = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "alchemy_getTokenBalances",
            "params": [wallet_address, "erc20"]
        }
        
        headers = {"accept": "application/json", "content-type": "application/json"}
        
        resp = httpx.post(base_url, json=balance_payload, headers=headers, timeout=10.0)
        resp.raise_for_status()
        
        data = resp.json()
        token_balances = data.get("result", {}).get("tokenBalances", [])
        
        # Sifirdan buyuk olan bakiyeleri filtrele
        non_zero_balances = [
            tb for tb in token_balances 
            if tb.get("tokenBalance") != "0x0" and tb.get("tokenBalance") != "0x0000000000000000000000000000000000000000000000000000000000000000"
        ]
        
        # Gercek projede her kontrat adresi icin metadata ve USD fiyati cekilir.
        # MVP (Minimum Viable Product) icin asagidaki yapiyi donduruyoruz.
        # Ileride CoinGecko veya baska bir servisle bu kontratlari fiyatlandirabiliriz.
        
        formatted_balances = []
        for tb in non_zero_balances[:10]: # Top 10 token for MVP
            contract_address = tb.get("contractAddress")
            raw_balance = tb.get("tokenBalance")
            # Convert hex to int, very basic estimation (assuming 18 decimals)
            # In production, alchemy_getTokenMetadata should be called for decimals
            try:
                numeric_balance = int(raw_balance, 16) / (10**18)
            except Exception:
                numeric_balance = 0
                
            formatted_balances.append({
                "contract_address": contract_address,
                "balance": numeric_balance,
                "symbol": "TKN", # Placeholder without metadata call
                "usd_value": 0 # Placeholder without pricing call
            })
            
        return {
            "balances": formatted_balances,
            "total_usd": 0
        }
        
    except Exception as e:
        return {"balances": [], "total_usd": 0, "error": str(e)}
