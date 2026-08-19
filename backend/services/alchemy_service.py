import os
import httpx
from typing import List, Dict, Any
from backend.services.price_service import get_live_prices_sync

def get_wallet_balances(wallet_address: str) -> Dict[str, Any]:
    '''
    Fetches the ERC20 token balances and native ETH balance for a given wallet address using Alchemy API.
    '''
    alchemy_api_key = os.getenv("ALCHEMY_API_KEY", "")
    
    if not alchemy_api_key:
        return {"balances": [], "total_usd": 0, "error": "ALCHEMY_API_KEY is not configured"}
        
    base_url = f"https://eth-mainnet.g.alchemy.com/v2/{alchemy_api_key}"
    headers = {"accept": "application/json", "content-type": "application/json"}
    formatted_balances = []
    
    try:
        # 1. Native ETH Balance
        eth_payload = {
            "id": 1,
            "jsonrpc": "2.0",
            "method": "eth_getBalance",
            "params": [wallet_address, "latest"]
        }
        eth_resp = httpx.post(base_url, json=eth_payload, headers=headers, timeout=10.0)
        eth_resp.raise_for_status()
        eth_data = eth_resp.json()
        
        raw_eth = eth_data.get("result", "0x0")
        try:
            eth_balance = int(raw_eth, 16) / (10**18)
            if eth_balance > 0:
                formatted_balances.append({
                    "contract_address": "native",
                    "balance": eth_balance,
                    "symbol": "ETH",
                    "usd_value": 0
                })
        except Exception:
            pass

        try:
            # 2. Token Balances
            balance_payload = {
                "id": 1,
                "jsonrpc": "2.0",
                "method": "alchemy_getTokenBalances",
                "params": [wallet_address, "erc20"]
            }
            
            resp = httpx.post(base_url, json=balance_payload, headers=headers, timeout=10.0)
            resp.raise_for_status()
            
            data = resp.json()
            token_balances = data.get("result", {}).get("tokenBalances", [])
            
            non_zero_balances = [
                tb for tb in token_balances 
                if tb.get("tokenBalance") != "0x0" and tb.get("tokenBalance") != "0x0000000000000000000000000000000000000000000000000000000000000000"
            ]
            
            # 3. Fetch Metadata for each token
            for tb in non_zero_balances[:10]: # Top 10 token for MVP
                contract_address = tb.get("contractAddress")
                raw_balance = tb.get("tokenBalance")
                
                meta_payload = {
                    "id": 1,
                    "jsonrpc": "2.0",
                    "method": "alchemy_getTokenMetadata",
                    "params": [contract_address]
                }
                
                try:
                    meta_resp = httpx.post(base_url, json=meta_payload, headers=headers, timeout=5.0)
                    meta_data = meta_resp.json().get("result", {})
                    
                    decimals = meta_data.get("decimals") or 18
                    symbol = meta_data.get("symbol") or "TKN"
                    
                    numeric_balance = int(raw_balance, 16) / (10**decimals)
                    
                    if numeric_balance > 0:
                        formatted_balances.append({
                            "contract_address": contract_address,
                            "balance": numeric_balance,
                            "symbol": symbol.upper(),
                            "usd_value": 0
                        })
                except Exception as e:
                    print(f"Metadata error for {contract_address}: {e}")
        except Exception as token_err:
            print(f"Token balance fetch error for {wallet_address}: {token_err}")
            
        # --- NEW: USD Price Calculation ---
        symbols = [b["symbol"] for b in formatted_balances]
        prices = get_live_prices_sync(symbols)
        
        total_usd = 0
        for b in formatted_balances:
            sym = b["symbol"]
            price = prices.get(sym, 0)
            b["usd_value"] = b["balance"] * price
            total_usd += b["usd_value"]
            
        return {
            "balances": formatted_balances,
            "total_usd": total_usd
        }
        
    except Exception as e:
        return {"balances": [], "total_usd": 0, "error": str(e)}

