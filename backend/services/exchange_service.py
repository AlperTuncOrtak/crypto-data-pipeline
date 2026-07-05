import ccxt.async_support as ccxt
from fastapi import HTTPException
import logging

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
            
            holdings = []
            if 'total' in balance:
                for currency, amount in balance['total'].items():
                    if amount > 0:
                        holdings.append({
                            "symbol": currency,
                            "quantity": amount
                        })
            
            await exchange.close()
            return holdings
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
