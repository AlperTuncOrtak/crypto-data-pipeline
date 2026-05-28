# ============================================================
# backend/auth.py
# ============================================================
import os
import httpx
from pathlib import Path
from dotenv import load_dotenv
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=True)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=True)

security = HTTPBearer()


def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    token = credentials.credentials

    # Degiskenleri her cagrimda oku — import sirasinda bos gelmez
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_anon_key = os.getenv("VITE_SUPABASE_KEY", "")

    if not supabase_url:
        raise HTTPException(status_code=500, detail="Supabase URL not configured")

    resp = httpx.get(
        f"{supabase_url}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": supabase_anon_key,
        },
        timeout=5.0,
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return resp.json()


def verify_pro(user: dict = Depends(verify_token)):
    # Gecici olarak tum giris yapmis kullanicilar PRO kabul ediliyor.
    # Uyelik sistemi (Stripe & Supabase user_plans) tam kurulana kadar test amaciyla acik.
    return user
