import logging
from fastapi import HTTPException
from pymysql.cursors import DictCursor
from shared.db import get_connection
from backend.services.market_service import get_latest_market

logger = logging.getLogger(__name__)

INITIAL_BALANCE = 100000.00

def get_or_create_account(user_id: str):
    """Get the user's paper trading account, creating it with 100k if it doesn't exist."""
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        cursor.execute("SELECT balance FROM paper_accounts WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
        
        if row:
            return float(row['balance'])
            
        # Create new account
        cursor.execute(
            "INSERT INTO paper_accounts (user_id, balance) VALUES (%s, %s)",
            (user_id, INITIAL_BALANCE)
        )
        conn.commit()
        return INITIAL_BALANCE
    finally:
        conn.close()

def get_portfolio(user_id: str):
    """Returns the user's cash balance, positions, and calculates unrealized PnL based on live prices."""
    balance = get_or_create_account(user_id)
    
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        cursor.execute(
            "SELECT id, symbol, amount, average_price FROM paper_positions WHERE user_id = %s AND amount > 0",
            (user_id,)
        )
        positions = cursor.fetchall()
        
        # Get live prices for these positions to calculate PnL
        market_data = get_latest_market(limit=250)
        price_map = {coin['symbol'].upper(): float(coin['current_price'] or 0) for coin in market_data}
        
        total_portfolio_value = balance
        formatted_positions = []
        
        for pos in positions:
            sym = pos['symbol'].upper()
            amount = float(pos['amount'])
            avg_price = float(pos['average_price'])
            current_price = price_map.get(sym, avg_price) # Fallback to avg_price if not found
            
            current_value = amount * current_price
            cost_basis = amount * avg_price
            unrealized_pnl = current_value - cost_basis
            unrealized_pnl_percent = (unrealized_pnl / cost_basis * 100) if cost_basis > 0 else 0
            
            total_portfolio_value += current_value
            
            formatted_positions.append({
                "id": pos['id'],
                "symbol": sym,
                "amount": amount,
                "average_price": avg_price,
                "current_price": current_price,
                "current_value": current_value,
                "unrealized_pnl": unrealized_pnl,
                "unrealized_pnl_percent": unrealized_pnl_percent
            })
            
        return {
            "balance": balance,
            "total_value": total_portfolio_value,
            "positions": formatted_positions
        }
    finally:
        conn.close()

def execute_trade(user_id: str, symbol: str, side: str, amount: float):
    """Executes a BUY or SELL trade at the current market price."""
    side = side.upper()
    symbol = symbol.upper()
    if side not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="Invalid trade side")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Get current price
    market_data = get_latest_market(limit=250)
    current_price = 0
    for coin in market_data:
        if coin['symbol'].upper() == symbol:
            current_price = float(coin['current_price'] or 0)
            break
            
    if current_price <= 0:
        raise HTTPException(status_code=400, detail=f"Price for {symbol} not found or invalid")

    total_value = amount * current_price
    
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        # Lock account row
        cursor.execute("SELECT balance FROM paper_accounts WHERE user_id = %s FOR UPDATE", (user_id,))
        row = cursor.fetchone()
        if not row:
            # Create account if it doesn't exist
            balance = get_or_create_account(user_id)
            cursor.execute("SELECT balance FROM paper_accounts WHERE user_id = %s FOR UPDATE", (user_id,))
            row = cursor.fetchone()
            
        balance = float(row['balance'])
        
        # Lock position row
        cursor.execute(
            "SELECT id, amount, average_price FROM paper_positions WHERE user_id = %s AND symbol = %s FOR UPDATE",
            (user_id, symbol)
        )
        pos = cursor.fetchone()
        
        pos_amount = float(pos['amount']) if pos else 0.0
        pos_avg_price = float(pos['average_price']) if pos else 0.0
        
        if side == "BUY":
            if balance < total_value:
                raise HTTPException(status_code=400, detail="Insufficient USD balance")
            
            new_balance = balance - total_value
            
            # Calculate new average price
            total_cost = (pos_amount * pos_avg_price) + total_value
            new_amount = pos_amount + amount
            new_avg_price = total_cost / new_amount
            
            cursor.execute("UPDATE paper_accounts SET balance = %s WHERE user_id = %s", (new_balance, user_id))
            
            if pos:
                cursor.execute(
                    "UPDATE paper_positions SET amount = %s, average_price = %s WHERE id = %s",
                    (new_amount, new_avg_price, pos['id'])
                )
            else:
                cursor.execute(
                    "INSERT INTO paper_positions (user_id, symbol, amount, average_price) VALUES (%s, %s, %s, %s)",
                    (user_id, symbol, new_amount, new_avg_price)
                )
                
        elif side == "SELL":
            if pos_amount < amount:
                raise HTTPException(status_code=400, detail="Insufficient coin balance")
                
            new_balance = balance + total_value
            new_amount = pos_amount - amount
            # Average price doesn't change on sell, unless amount becomes 0
            new_avg_price = pos_avg_price if new_amount > 0 else 0
            
            cursor.execute("UPDATE paper_accounts SET balance = %s WHERE user_id = %s", (new_balance, user_id))
            cursor.execute(
                "UPDATE paper_positions SET amount = %s, average_price = %s WHERE id = %s",
                (new_amount, new_avg_price, pos['id'])
            )

        # Log trade
        cursor.execute(
            """INSERT INTO paper_trades (user_id, symbol, side, amount, price, total_value) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (user_id, symbol, side, amount, current_price, total_value)
        )
        
        conn.commit()
        return {"status": "success", "message": f"{side} {amount} {symbol} successful", "balance": new_balance}
        
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Trade execution failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during trade execution")
    finally:
        conn.close()

def get_trade_history(user_id: str, limit: int = 50):
    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        cursor.execute(
            "SELECT id, symbol, side, amount, price, total_value, executed_at FROM paper_trades WHERE user_id = %s ORDER BY executed_at DESC LIMIT %s",
            (user_id, limit)
        )
        rows = cursor.fetchall()
        for r in rows:
            r['amount'] = float(r['amount'])
            r['price'] = float(r['price'])
            r['total_value'] = float(r['total_value'])
            r['executed_at'] = r['executed_at'].isoformat() if hasattr(r['executed_at'], 'isoformat') else str(r['executed_at'])
        return rows
    finally:
        conn.close()

def reset_account(user_id: str):
    """Resets the user's paper trading account to initial state."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM paper_trades WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM paper_positions WHERE user_id = %s", (user_id,))
        cursor.execute("UPDATE paper_accounts SET balance = %s WHERE user_id = %s", (INITIAL_BALANCE, user_id))
        conn.commit()
        return {"status": "success", "message": "Account reset to $100,000"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Reset failed: {e}")
        raise HTTPException(status_code=500, detail="Reset failed")
    finally:
        conn.close()
