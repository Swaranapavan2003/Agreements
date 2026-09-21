from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from app.models.notification import Notification
from app.models.user import User
from app.core.exceptions import NotFoundError
from datetime import datetime, timezone
from typing import Optional
import uuid
import structlog

log = structlog.get_logger()

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        title: str,
        message: str,
        type: str = "info",
        event: str = "general",
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        metadata: Optional[dict] = None,
    ) -> Notification:
        n = Notification(
            organization_id=organization_id,
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            event=event,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_=metadata,
        )
        self.db.add(n)
        await self.db.flush()
        return n
    
    async def get_user_notifications(
        self, user_id: uuid.UUID, org_id: uuid.UUID, page: int = 1, per_page: int = 20, unread_only: bool = False
    ) -> tuple[list[Notification], int]:
        stmt = select(Notification).where(
            Notification.user_id == user_id,
            Notification.organization_id == org_id
        )
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        
        stmt = stmt.order_by(Notification.is_read.asc(), Notification.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        results = (await self.db.execute(stmt)).scalars().all()
        return list(results), total
    
    async def get_unread_count(self, user_id: uuid.UUID, org_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count()).where(
                Notification.user_id == user_id,
                Notification.organization_id == org_id,
                Notification.is_read == False
            )
        )
        return result.scalar_one()
    
    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID, org_id: uuid.UUID):
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.organization_id == org_id
            )
        )
        n = result.scalar_one_or_none()
        if not n:
            raise NotFoundError("Notification not found")
        n.is_read = True
        n.read_at = datetime.now(timezone.utc)
        await self.db.commit()
    
    async def mark_all_read(self, user_id: uuid.UUID, org_id: uuid.UUID):
        await self.db.execute(
            update(Notification).where(
                Notification.user_id == user_id,
                Notification.organization_id == org_id,
                Notification.is_read == False
            ).values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
    
    async def notify_user(
        self,
        user: User,
        event: str,
        title: str,
        message: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[uuid.UUID] = None,
        send_email: bool = False,
        metadata: Optional[dict] = None,
    ) -> Notification:
        n = await self.create(
            organization_id=user.organization_id,
            user_id=user.id,
            title=title,
            message=message,
            type="info",
            event=event,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata,
        )
        if send_email:
            try:
                from app.workers.notification_tasks import send_notification_email_task
                send_notification_email_task.delay(str(user.id), title, message)
            except Exception as e:
                log.warning("failed_to_queue_notification_email", error=str(e))
        return n
