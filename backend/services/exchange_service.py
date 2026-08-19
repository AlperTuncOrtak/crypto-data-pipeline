import ccxt.async_support as ccxt
from fastapi import HTTPException
import logging
from backend.services.price_service import get_live_prices_async

logger = logging.getLogger(__name__)

async def sync_exchange_balance(exchange_id: str, api_key: str, secret: str, password: str = None):
    try:
        # Standardize exchange_id (e.g. 'Binance' -> 'binance')
        exchange_id = exchange_id.lower().replace(" ", "")
        
        if exchange_id not in ccxt.exchanges:
            raise HTTPException(status_code=400, detail=f"Unsupported exchange: {exchange_id}")

        exchange_class = getattr(ccxt, exchange_id)
        
        exchange_params = {
            'apiKey': api_key,
            'secret': secret,
            'enableRateLimit': True,
        }
        
        if password:
            exchange_params['password'] = password

        exchange = exchange_class(exchange_params)

        try:
            # Fetch spot balances
            balance = await exchange.fetch_balance()
            
            raw_holdings = []
            if 'total' in balance:
                for currency, amount in balance['total'].items():
                    if amount > 0:
                        raw_holdings.append({
                            "symbol": currency,
                            "quantity": amount
                        })
            
            await exchange.close()
            
            if not raw_holdings:
                return []
                
            # --- NEW: USD Price Calculation and Dust Filter ---
            symbols = [h["symbol"] for h in raw_holdings]
            prices = await get_live_prices_async(symbols)
            
            filtered_holdings = []
            for h in raw_holdings:
                sym = h["symbol"]
                price = prices.get(sym, 0)
                usd_value = h["quantity"] * price
                
                # Sadece USDC/USDT/USD veya degeri > 1$ olanlar kalsin. Ayrica fiyat bulamadigimiz coini dusuk miktarliyken gostermeyelim
                # Eger fiyat bulunamadiysa (0) ve miktari asiri buyuk degilse (100+) filtrele
                is_stablecoin = sym in ["USDT", "USDC", "BUSD", "DAI", "FDUSD", "TUSD", "USDE"]
                
                if usd_value >= 1.0 or is_stablecoin or (price == 0 and h["quantity"] > 100):
                    h["usd_value"] = usd_value
                    h["price"] = price
                    filtered_holdings.append(h)
                    
            # Sort by usd_value descending
            filtered_holdings.sort(key=lambda x: x.get("usd_value", 0), reverse=True)
            
            return filtered_holdings
            
        except ccxt.AuthenticationError as e:
            await exchange.close()
            raise HTTPException(status_code=401, detail="Invalid API Key, Secret, or Password.")
        except Exception as e:
            await exchange.close()
            logger.error(f"Error fetching balance from {exchange_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Exchange error: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in sync_exchange_balance: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
