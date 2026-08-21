from fastapi import APIRouter, Depends, HTTPException
import os
from supabase import create_client
from backend.auth import verify_token
from backend.services.alchemy_service import get_wallet_balances
from pydantic import BaseModel

router = APIRouter(prefix="/wallets", tags=["wallets"])

import re

class LinkWalletRequest(BaseModel):
    wallet_address: str
    provider: str = "metamask"

    def __init__(self, **data):
        super().__init__(**data)
        if not re.match(r"^0x[a-fA-F0-9]{40}$", self.wallet_address):
            raise ValueError("Invalid EVM wallet address format")

@router.post("/link")
def link_wallet(request: LinkWalletRequest, user: dict = Depends(verify_token)):
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    if not supabase_url or not supabase_service_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    sb = create_client(supabase_url, supabase_service_key)
    
    try:
        # Cuzdan baska bir kullaniciya bagliysa DOKUNMA.
        # (Eskiden burada o kayit siliniyordu; bu, saldirganin kurbanin
        #  adresini "link"leyerek kurbanin cuzdan baglantisini koparmasina
        #  izin veriyordu. Adres sahipligi imza ile dogrulanmadigi surece
        #  ilk baglayan kullanicida kalmali.)
        existing = (
            sb.table("user_wallets")
            .select("user_id")
            .eq("wallet_address", request.wallet_address)
            .execute()
        )
        if existing.data and any(r["user_id"] != user["id"] for r in existing.data):
            raise HTTPException(
                status_code=409,
                detail="This wallet address is already linked to another account.",
            )

        # 1. Her kullaniciya sadece 1 cuzdan (eskiyi sil)
        sb.table("user_wallets").delete().eq("user_id", user["id"]).execute()

        # 2. Yeni cuzdani ekle
        result = sb.table("user_wallets").insert({
            "user_id": user["id"],
            "wallet_address": request.wallet_address,
            "provider": request.provider
        }).execute()
        
        return {"status": "success", "data": result.data}
    except HTTPException:
        # 409 gibi kasitli hatalari 500'e cevirme
        raise
    except Exception as e:
        print(f"Error linking wallet: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while linking wallet")

@router.get("")
def get_linked_wallets(user: dict = Depends(verify_token)):
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    sb = create_client(supabase_url, supabase_service_key)
    
    result = sb.table("user_wallets").select("*").eq("user_id", user["id"]).execute()
    return {"wallets": result.data}

@router.get("/portfolio")
def get_wallet_portfolio(user: dict = Depends(verify_token)):
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    sb = create_client(supabase_url, supabase_service_key)
    
    result = sb.table("user_wallets").select("wallet_address").eq("user_id", user["id"]).execute()
    
    if not result.data or len(result.data) == 0:
        return {"balances": [], "total_usd": 0}
        
    wallet_address = result.data[0]["wallet_address"]
    portfolio = get_wallet_balances(wallet_address)
    
    return {"wallet": wallet_address, "portfolio": portfolio}
