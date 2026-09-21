from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.common import APIResponse
from app.models.user import User
from app.models.billing import Subscription, UsageRecord
from app.services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["Billing"])

class CheckoutRequest(BaseModel):
    plan_id: uuid.UUID

@router.post("/checkout", response_model=APIResponse[dict])
async def create_checkout(
    req: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = BillingService(db)
    try:
        url = await svc.create_checkout_session(current_user.organization_id, req.plan_id)
        return {"success": True, "data": {"url": url}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/subscription", response_model=APIResponse[dict])
async def get_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Subscription).where(Subscription.organization_id == current_user.organization_id))
    subscription = result.scalar_one_or_none()
    
    usage_result = await db.execute(select(UsageRecord).where(UsageRecord.organization_id == current_user.organization_id))
    usage_records = usage_result.scalars().all()
    
    data = {
        "subscription": {
            "id": str(subscription.id) if subscription else None,
            "status": subscription.status if subscription else "inactive",
            "current_period_end": subscription.current_period_end.isoformat() if subscription and subscription.current_period_end else None,
            "plan_id": str(subscription.plan_id) if subscription else None
        },
        "usage": {
            ur.metric_name: ur.count for ur in usage_records
        }
    }
    return {"success": True, "data": data}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature header")
        
    svc = BillingService(db)
    try:
        await svc.handle_webhook(payload, sig_header)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"success": True}
