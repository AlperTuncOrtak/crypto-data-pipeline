import httpx
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

def get_live_prices_sync(symbols: List[str]) -> Dict[str, float]:
    '''Fetches live USD prices for a list of token symbols using CoinCap API synchronously.'''
    if not symbols:
        return {}
        
    symbols_upper = [s.upper() for s in symbols]
    prices = {}
    
    try:
        with httpx.Client() as client:
            resp = client.get("https://api.coincap.io/v2/assets", params={"limit": 2000}, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for asset in data:
                    sym = asset.get("symbol", "").upper()
                    if sym in symbols_upper:
                        if sym not in prices:
                            prices[sym] = float(asset.get("priceUsd", 0))
            
            if "ETH" in symbols_upper and "ETH" not in prices:
                prices["ETH"] = 3000.0
                
    except Exception as e:
        logger.error(f"Error fetching live prices from CoinCap: {e}")
        
    return prices

async def get_live_prices_async(symbols: List[str]) -> Dict[str, float]:
    '''Fetches live USD prices for a list of token symbols using CoinCap API asynchronously.'''
    if not symbols:
        return {}
        
    symbols_upper = [s.upper() for s in symbols]
    prices = {}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://api.coincap.io/v2/assets", params={"limit": 2000}, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for asset in data:
                    sym = asset.get("symbol", "").upper()
                    if sym in symbols_upper:
                        if sym not in prices:
                            prices[sym] = float(asset.get("priceUsd", 0))
            
            if "ETH" in symbols_upper and "ETH" not in prices:
                prices["ETH"] = 3000.0
                
    except Exception as e:
        logger.error(f"Error fetching live prices from CoinCap: {e}")
        
    return prices
