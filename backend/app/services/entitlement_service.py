from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.subscription import Plan, PlanVersion, Subscription, Entitlement, UsageRecord
from app.core.exceptions import LimitExceededError
from datetime import datetime, timezone, date, timedelta
from typing import Optional
import uuid

class EntitlementService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_entitlement(self, organization_id: uuid.UUID) -> Optional[Entitlement]:
        result = await self.db.execute(
            select(Entitlement).where(Entitlement.organization_id == organization_id)
        )
        return result.scalar_one_or_none()
    
    async def check_feature(self, organization_id: uuid.UUID, feature: str) -> bool:
        ent = await self.get_entitlement(organization_id)
        if not ent:
            return False
        return bool(ent.features.get(feature, False))
    
    async def require_feature(self, organization_id: uuid.UUID, feature: str):
        if not await self.check_feature(organization_id, feature):
            raise LimitExceededError(f"Feature '{feature}' not available on your current plan. Please upgrade.")
    
    async def check_limit(self, organization_id: uuid.UUID, limit: str, current_usage: int) -> bool:
        ent = await self.get_entitlement(organization_id)
        if not ent:
            return False
        limit_val = ent.limits.get(limit, 0)
        if limit_val == -1:  # unlimited
            return True
        return current_usage < limit_val
    
    async def require_within_limit(self, organization_id: uuid.UUID, limit: str, current_usage: int):
        ent = await self.get_entitlement(organization_id)
        if ent:
            limit_val = ent.limits.get(limit, 0)
            if limit_val != -1 and current_usage >= limit_val:
                raise LimitExceededError(f"You have reached the limit for '{limit}'. Please upgrade your plan.")
    
    async def get_usage(self, organization_id: uuid.UUID) -> Optional[UsageRecord]:
        today = date.today()
        period_start = today.replace(day=1)
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        result = await self.db.execute(
            select(UsageRecord).where(
                UsageRecord.organization_id == organization_id,
                UsageRecord.period_start == period_start,
            )
        )
        return result.scalar_one_or_none()
    
    async def increment_usage(self, organization_id: uuid.UUID, field: str, amount: int = 1):
        today = date.today()
        period_start = today.replace(day=1)
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        usage = await self.get_usage(organization_id)
        if not usage:
            usage = UsageRecord(
                organization_id=organization_id,
                period_start=period_start,
                period_end=period_end,
            )
            self.db.add(usage)
            await self.db.flush()
        
        current = getattr(usage, field, 0) or 0
        setattr(usage, field, current + amount)
        await self.db.flush()
    
    async def create_free_subscription(self, organization_id: uuid.UUID):
        """Create Free plan subscription + entitlement snapshot for new org."""
        free_pv = await self.db.execute(
            select(PlanVersion)
            .join(Plan, Plan.id == PlanVersion.plan_id)
            .where(Plan.name == "Free", PlanVersion.is_current == True)
        )
        free_pv = free_pv.scalar_one_or_none()
        if not free_pv:
            return  # Plans not seeded yet
        
        sub = Subscription(
            organization_id=organization_id,
            plan_id=free_pv.plan_id,
            plan_version_id=free_pv.id,
            status="active",
            starts_at=datetime.now(timezone.utc),
        )
        self.db.add(sub)
        await self.db.flush()
        
        # Create entitlement SNAPSHOT - never modify this when plan changes
        ent = Entitlement(
            organization_id=organization_id,
            subscription_id=sub.id,
            features=dict(free_pv.features),  # snapshot
            limits=dict(free_pv.limits),       # snapshot
        )
        self.db.add(ent)
        await self.db.flush()
