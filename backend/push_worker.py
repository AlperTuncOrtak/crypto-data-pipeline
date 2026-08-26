import asyncio
import os
import json
from datetime import datetime
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "crypto_analysis")

def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

async def check_alerts():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Get active alerts
            cursor.execute("SELECT * FROM user_alerts WHERE active = 1")
            alerts = cursor.fetchall()
            
            if not alerts:
                return
                
            # Get latest prices for coins in alerts
            symbols = list(set([a['symbol'] for a in alerts]))
            placeholders = ','.join(['%s'] * len(symbols))
            cursor.execute(f"SELECT c.symbol, lp.current_price FROM latest_prices lp JOIN coins c ON lp.coin_id = c.id WHERE c.symbol IN ({placeholders})", symbols)
            prices = {row['symbol']: float(row['current_price']) for row in cursor.fetchall()}
            
            for alert in alerts:
                sym = alert['symbol']
                if sym not in prices:
                    continue
                    
                current_price = prices[sym]
                target = float(alert['target_price'])
                triggered = False
                
                if alert['is_above'] and current_price >= target:
                    triggered = True
                elif not alert['is_above'] and current_price <= target:
                    triggered = True
                    
                if triggered:
                    # Get user device token
                    cursor.execute("SELECT token FROM user_device_tokens WHERE user_id = %s", (alert['user_id'],))
                    tokens = cursor.fetchall()
                    for t in tokens:
                        # Send push
                        print(f"[PUSH NOTIFICATION] Sending to {t['token']}: {sym} reached !")
                    
                    # Deactivate alert
                    cursor.execute("UPDATE user_alerts SET active = 0 WHERE id = %s", (alert['id'],))
                    
    except Exception as e:
        print(f"Error checking alerts: {e}")
    finally:
        conn.close()

async def main():
    print("Starting Push Notification Worker...")
    while True:
        await check_alerts()
        await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())
