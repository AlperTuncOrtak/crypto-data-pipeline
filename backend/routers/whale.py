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

from backend.services.whale_service import analyze_wallet

@router.get("/api/whales/analyze/{address}")
def analyze_wallet_endpoint(address: str):
    return analyze_wallet(address)

from backend.services.whale_service import get_ml_anomalies

@router.get("/api/whales/ml-anomalies")
def ml_anomalies_endpoint(symbol: str = None, limit: int = 10):
    return get_ml_anomalies(symbol, limit)
