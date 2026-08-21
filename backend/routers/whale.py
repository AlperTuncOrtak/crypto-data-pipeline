import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.services.whale_service import whale_data_generator

router = APIRouter()

@router.websocket("/feed")
async def whale_feed_websocket(websocket: WebSocket):
    await websocket.accept()
    generator = whale_data_generator()
    try:
        while True:
            # Get the next simulated whale transaction
            tx = await anext(generator)
            # Send it to the client
            await websocket.send_json(tx)
    except WebSocketDisconnect:
        print("Client disconnected from whale feed")
    except Exception as e:
        print(f"Whale feed error: {e}")

import re

from backend.services.whale_service import analyze_wallet
from backend.auth import verify_pro
from fastapi import Depends, HTTPException

_EVM_ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")


@router.get("/api/whales/analyze/{address}")
def analyze_wallet_endpoint(address: str, user: dict = Depends(verify_pro)):
    """
    Whale X-Ray. PRO ozelligi ve her cagri Alchemy + Groq kotasi harciyor,
    bu yuzden verify_pro arkasinda. Arayuz zaten ProPaywall ile kapali;
    burasi o kapinin sunucu tarafi.
    """
    if not _EVM_ADDRESS.match(address.strip()):
        raise HTTPException(status_code=400, detail="Invalid EVM address format")
    return analyze_wallet(address.strip())


