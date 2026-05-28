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
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "")

    if not supabase_service_key:
        # Service key yoksa (dev ortami) plan kontrolunu atla
        return user

    try:
        sb = create_client(supabase_url, supabase_service_key)
        result = (
            sb.table("user_plans")
            .select("plan, expires_at")
            .eq("user_id", user["id"])
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=403, detail="Pro plan required")

        plan = result.data.get("plan", "free")
        expires_at = result.data.get("expires_at")

        if expires_at:
            from datetime import datetime, timezone

            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if expiry < datetime.now(timezone.utc):
                plan = "free"

        if plan not in ("pro", "enterprise"):
            raise HTTPException(status_code=403, detail="Pro plan required")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=403, detail="Plan verification failed")

    return user
