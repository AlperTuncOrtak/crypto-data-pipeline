from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.auth import verify_token
from backend.services.paper_service import get_portfolio, execute_trade

router = APIRouter(prefix="/paper", tags=["Paper Trading"])

class TradeRequest(BaseModel):
    symbol: str
    side: str
    amount: float

@router.get("/portfolio")
def get_user_portfolio(user: dict = Depends(verify_token)):
    return get_portfolio(user['id'])

@router.post("/trade")
def place_trade(req: TradeRequest, user: dict = Depends(verify_token)):
    return execute_trade(user['id'], req.symbol, req.side, req.amount)
