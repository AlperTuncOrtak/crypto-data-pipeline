from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from shared.db import get_connection
from backend.routers.stripe_router import _get_supabase_admin
from datetime import datetime, timedelta, timezone
from pymysql.cursors import DictCursor

router = APIRouter()

class RedeemRequest(BaseModel):
    user_id: str
    promo_code: str
    device_fingerprint: str

@router.post("/redeem")
async def redeem_promo(req: Request, data: RedeemRequest):
    ip_address = req.client.host
    code = data.promo_code.upper()

    conn = get_connection()
    try:
        cursor = conn.cursor(DictCursor)
        
        # 1. Check if code exists and is valid
        cursor.execute("SELECT * FROM promo_codes WHERE code = %s", (code,))
        promo = cursor.fetchone()
        if not promo:
            raise HTTPException(status_code=400, detail="Invalid promo code")
        
        if promo['current_uses'] >= promo['max_uses']:
            raise HTTPException(status_code=400, detail="Promo code usage limit reached")

        # 2. Anti-abuse: Check if user already redeemed
        cursor.execute("SELECT id FROM promo_redemptions WHERE user_id = %s", (data.user_id,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="You have already redeemed a promo code")

        # 3. Anti-abuse: Check device fingerprint
        cursor.execute("SELECT id FROM promo_redemptions WHERE device_fingerprint = %s", (data.device_fingerprint,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="This device has already been used for a trial")

        # 4. Anti-abuse: Check IP Address (Optional but requested)
        cursor.execute("SELECT COUNT(id) as count FROM promo_redemptions WHERE ip_address = %s", (ip_address,))
        ip_check = cursor.fetchone()
        if ip_check and ip_check['count'] >= 2: # Allow max 2 redemptions per IP to be safe for NAT/household
            raise HTTPException(status_code=400, detail="Too many redemptions from this IP address")

        # 5. Record redemption
        cursor.execute(
            "INSERT INTO promo_redemptions (user_id, promo_code, ip_address, device_fingerprint) VALUES (%s, %s, %s, %s)",
            (data.user_id, code, ip_address, data.device_fingerprint)
        )
        
        # Increment uses
        cursor.execute("UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = %s", (code,))
        conn.commit()

        # 6. Update user's PRO status in Supabase
        sb = _get_supabase_admin()
        future_date = (datetime.now(timezone.utc) + timedelta(days=promo['trial_days'])).isoformat()
        sb.table("user_plans").upsert({
            "user_id": data.user_id,
            "plan": "pro",
            "stripe_sub_id": f"promo_{code}_{data.user_id}",
            "expires_at": future_date
        }).execute()

        return {"ok": True, "message": f"Successfully activated {promo['trial_days']} days of PRO!"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Promo Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()
