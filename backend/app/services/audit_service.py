from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.audit import AuditLog
from typing import Optional
import uuid

class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def log(
        self,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        organization_id: Optional[uuid.UUID] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        request_metadata: Optional[dict] = None,
    ) -> AuditLog:
        """Append-only audit log. Never update or delete entries."""
        meta = request_metadata or {}
        log_entry = AuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            user_id=user_id,
            organization_id=organization_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=meta.get("ip_address"),
            user_agent=meta.get("user_agent"),
        )
        self.db.add(log_entry)
        await self.db.flush()
        return log_entry
    
    async def get_logs(
        self,
        organization_id: uuid.UUID,
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        page: int = 1,
        per_page: int = 50,
    ) -> tuple[list[AuditLog], int]:
        stmt = select(AuditLog).where(AuditLog.organization_id == organization_id)
        if resource_type:
            stmt = stmt.where(AuditLog.resource_type == resource_type)
        if resource_id:
            stmt = stmt.where(AuditLog.resource_id == resource_id)
        if user_id:
            stmt = stmt.where(AuditLog.user_id == user_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        
        stmt = stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        logs = (await self.db.execute(stmt)).scalars().all()
        return list(logs), total
