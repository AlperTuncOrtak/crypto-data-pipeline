import os
import stripe
from fastapi import APIRouter, HTTPException, Request, Depends, Header
from pydantic import BaseModel
from typing import Optional
from backend.auth import verify_token
from supabase import create_client

router = APIRouter(prefix="/stripe", tags=["Stripe"])

# Initialize Stripe with Secret Key (from env)
# We read it on every request or module load, but reading dynamically ensures it picks up .env changes
def get_stripe_key():
    return os.getenv("STRIPE_SECRET_KEY", "")

def get_webhook_secret():
    return os.getenv("STRIPE_WEBHOOK_SECRET", "")

def get_price_id():
    return os.getenv("STRIPE_PRICE_ID", "")

def get_frontend_url():
    return os.getenv("FRONTEND_URL", "http://localhost:5173")

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
    
    # In a real app, you would have multiple price IDs based on request.plan and request.billing
    # For now, we just use the default STRIPE_PRICE_ID
    price_id = get_price_id()
    frontend_url = get_frontend_url()
    
    if not stripe.api_key or not price_id:
        raise HTTPException(status_code=500, detail="Stripe configuration is missing")

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
                "plan": request.plan,
                "billing": request.billing
            }
        )
        return CheckoutResponse(url=session.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
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
        
        user_id = session.get("client_reference_id")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        
        if user_id:
            _update_user_plan(user_id, "pro", customer_id, subscription_id)

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription.get("customer")
        
        if customer_id:
            _downgrade_user_by_customer(customer_id)

    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        customer_id = subscription.get("customer")
        status = subscription.get("status")
        
        if status in ["canceled", "unpaid", "past_due"]:
            _downgrade_user_by_customer(customer_id)
        elif status == "active":
            _upgrade_user_by_customer(customer_id)

    return {"status": "success"}


def _get_supabase_admin():
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_svc_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not supabase_url or not supabase_svc_key:
        return None
    return create_client(supabase_url, supabase_svc_key)

def _update_user_plan(user_id: str, plan: str, customer_id: str, subscription_id: str):
    sb = _get_supabase_admin()
    if not sb: return
    
    # 1 year from now by default, or just rely on status if you prefer.
    # For now we just set an arbitrary future date and rely on Stripe Webhooks to manage it.
    from datetime import datetime, timedelta, timezone
    future_date = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    
    # Upsert the user_plans row
    sb.table("user_plans").upsert({
        "user_id": user_id,
        "plan": plan,
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
        "expires_at": future_date
    }, on_conflict="user_id").execute()

def _downgrade_user_by_customer(customer_id: str):
    sb = _get_supabase_admin()
    if not sb: return
    
    # Find the user by customer_id and set plan to 'free'
    res = sb.table("user_plans").select("user_id").eq("stripe_customer_id", customer_id).execute()
    if res.data:
        for row in res.data:
            sb.table("user_plans").update({"plan": "free"}).eq("user_id", row["user_id"]).execute()

def _upgrade_user_by_customer(customer_id: str):
    sb = _get_supabase_admin()
    if not sb: return
    
    res = sb.table("user_plans").select("user_id").eq("stripe_customer_id", customer_id).execute()
    if res.data:
        for row in res.data:
            sb.table("user_plans").update({"plan": "pro"}).eq("user_id", row["user_id"]).execute()
