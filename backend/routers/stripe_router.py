import os
import stripe
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel
from typing import Optional
from backend.auth import verify_token
from supabase import create_client

router = APIRouter(prefix="/stripe", tags=["Stripe"])

# Eski kurulumda webhook main.py icinde koke ("/webhook") bagliydi.
# Stripe Dashboard'da hangi URL'in kayitli oldugunu koddan bilemedigimiz icin
# iki yol da ayni handler'a gidiyor. Dashboard /stripe/webhook'a cevrildikten
# sonra bu alias kaldirilabilir.
legacy_router = APIRouter(tags=["Stripe (legacy)"], include_in_schema=False)

# Initialize Stripe with Secret Key (from env)
# We read it on every request or module load, but reading dynamically ensures it picks up .env changes
def get_stripe_key():
    return os.getenv("STRIPE_SECRET_KEY", "")

def get_webhook_secret():
    return os.getenv("STRIPE_WEBHOOK_SECRET", "")

def get_price_id(plan: str = "pro", billing: str = "monthly"):
    """
    Plan + faturalama donemine gore Stripe price ID'sini bulur.
    .env'de STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_YEARLY olarak duruyor.
    STRIPE_PRICE_ID tek-fiyatli eski kurulum icin geri donus.
    """
    key = f"STRIPE_PRICE_{plan.upper()}_{billing.upper()}"
    return os.getenv(key, "") or os.getenv("STRIPE_PRICE_ID", "")

def get_frontend_url():
    return os.getenv("FRONTEND_URL", "https://www.cryptoneko.online")

class CheckoutResponse(BaseModel):
    url: str

class CheckoutRequest(BaseModel):
    plan: str
    billing: str

@router.post("/create-checkout-session", response_model=CheckoutResponse)
def create_checkout_session(request: CheckoutRequest, user: dict = Depends(verify_token)):
    """
    Creates a Stripe Checkout session for the authenticated user.
    We pass the Supabase user ID inside client_reference_id.
    """
    stripe.api_key = get_stripe_key()

    price_id = get_price_id(request.plan, request.billing)
    frontend_url = get_frontend_url()

    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    if not price_id:
        raise HTTPException(
            status_code=400,
            detail=f"Price not configured: STRIPE_PRICE_{request.plan.upper()}_{request.billing.upper()}",
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{frontend_url}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/cancel",
            client_reference_id=user["id"], # Store Supabase user ID!
            customer_email=user.get("email"),
            allow_promotion_codes=True,
            billing_address_collection="auto",
            metadata={
                # user_id'yi metadata'ya da yaziyoruz: client_reference_id
                # bazi event tiplerinde tasinmiyor, metadata tasiniyor.
                "user_id": user["id"],
                "plan": request.plan,
                "billing": request.billing
            }
        )
        return CheckoutResponse(url=session.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
@legacy_router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """
    Stripe calls this endpoint securely to notify us of payment success/failure.
    """
    stripe.api_key = get_stripe_key()
    webhook_secret = get_webhook_secret()
    
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret missing")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # user_id her iki yerde de tasiniyor; hangisi doluysa onu kullan.
        metadata = session.get("metadata") or {}
        user_id = session.get("client_reference_id") or metadata.get("user_id")
        plan = metadata.get("plan") or "pro"
        subscription_id = session.get("subscription")

        if user_id:
            _update_user_plan(user_id, plan, subscription_id)

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        # Bu event'te object'in kendisi abonelik, yani .id = subscription id
        if subscription.get("id"):
            _set_plan_by_subscription(subscription["id"], "free")

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        subscription_id = subscription.get("id")
        status = subscription.get("status")

        if subscription_id:
            if status in ["canceled", "unpaid", "past_due"]:
                _set_plan_by_subscription(subscription_id, "free")
            elif status == "active":
                _set_plan_by_subscription(subscription_id, "pro")

    return {"status": "success"}


def _get_supabase_admin():
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_svc_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not supabase_url or not supabase_svc_key:
        return None
    return create_client(supabase_url, supabase_svc_key)

# DIKKAT: user_plans tablosunda SADECE su kolonlar var:
#   id, user_id, plan, stripe_sub_id, expires_at, created_at, updated_at
# Bu fonksiyonlar eskiden stripe_customer_id / stripe_subscription_id'ye
# yaziyordu; ikisi de tabloda yok, dolayisiyla her webhook sessizce
# basarisiz oluyordu (odeme alinip kullanici PRO yapilmiyordu).

def _update_user_plan(user_id: str, plan: str, subscription_id: str):
    sb = _get_supabase_admin()
    if not sb: return

    from datetime import datetime, timedelta, timezone
    # Stripe abonelik durumunu webhook'larla yonetiyoruz; expires_at yalnizca
    # webhook kacarsa devreye giren emniyet siniri.
    future_date = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()

    sb.table("user_plans").upsert({
        "user_id": user_id,
        "plan": plan,
        "stripe_sub_id": subscription_id,
        "expires_at": future_date
    }, on_conflict="user_id").execute()

def _set_plan_by_subscription(subscription_id: str, plan: str):
    """Stripe abonelik ID'sinden kullaniciyi bulup planini gunceller."""
    sb = _get_supabase_admin()
    if not sb: return

    sb.table("user_plans").update({"plan": plan}).eq("stripe_sub_id", subscription_id).execute()
