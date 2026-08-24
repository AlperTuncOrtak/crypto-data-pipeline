"""
Copy Trading Faz 1 endpoint'leri.

DIKKAT: Bu fazda hicbir islem yapilmiyor, hicbir cuzdana dokunulmuyor.
Sadece balina listesi ve "kimi takip ediyorum" kaydi.
"""
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from backend.auth import verify_token
from backend.services import copy_service

router = APIRouter(prefix="/copy", tags=["Copy Trading"])

# Liste giris yapmadan da gorunsun (kesif icin), ama giris yapilmissa
# "takip ediyorum" durumu da gelsin. auto_error=False olmasa token
# yoklugunda 401 atardi.
_optional_bearer = HTTPBearer(auto_error=False)


def optional_user(
    credentials: HTTPAuthorizationCredentials = Security(_optional_bearer),
) -> dict | None:
    if not credentials:
        return None
    try:
        return verify_token(credentials)
    except HTTPException:
        # Bayat token yuzunden herkese acik listeyi patlatma.
        return None


class FollowRequest(BaseModel):
    leader_id: int
    allocation_usd: float = 50.0


class UnfollowRequest(BaseModel):
    leader_id: int


class AddLeaderRequest(BaseModel):
    address: str
    label: str = Field(max_length=60)
    note: str | None = Field(default=None, max_length=255)


@router.get("/leaders")
def leaders(user: dict | None = Depends(optional_user)):
    return copy_service.list_leaders(user["id"] if user else None)


@router.get("/following")
def following(user: dict = Depends(verify_token)):
    return copy_service.list_following(user["id"])


@router.post("/follow")
def follow(req: FollowRequest, user: dict = Depends(verify_token)):
    return copy_service.follow(user["id"], req.leader_id, req.allocation_usd)


@router.post("/unfollow")
def unfollow(req: UnfollowRequest, user: dict = Depends(verify_token)):
    return copy_service.unfollow(user["id"], req.leader_id)


@router.post("/leaders")
def add_leader(req: AddLeaderRequest, user: dict = Depends(verify_token)):
    return copy_service.add_leader(user["id"], req.address, req.label, req.note)
