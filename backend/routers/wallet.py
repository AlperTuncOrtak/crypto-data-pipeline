from fastapi import APIRouter, Depends, HTTPException
import os
from supabase import create_client
from backend.auth import verify_token
from backend.services.alchemy_service import get_wallet_balances
from pydantic import BaseModel

router = APIRouter(prefix="/wallets", tags=["wallets"])

class LinkWalletRequest(BaseModel):
    wallet_address: str
    provider: str = "metamask"

@router.post("/link")
def link_wallet(request: LinkWalletRequest, user: dict = Depends(verify_token)):
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    if not supabase_url or not supabase_service_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    sb = create_client(supabase_url, supabase_service_key)
    
    try:
        # 1. Her kullaniciya sadece 1 cuzdan (eskiyi sil)
        sb.table("user_wallets").delete().eq("user_id", user["id"]).execute()
        
        # Baska kullanici ayni cuzdani eklemisse onu da sil (unique constraint korumasi)
        sb.table("user_wallets").delete().eq("wallet_address", request.wallet_address).execute()
        
        # 2. Yeni cuzdani ekle
        result = sb.table("user_wallets").insert({
            "user_id": user["id"],
            "wallet_address": request.wallet_address,
            "provider": request.provider
        }).execute()
        
        return {"status": "success", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
