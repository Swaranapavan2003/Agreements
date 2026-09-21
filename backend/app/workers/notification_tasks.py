import asyncio
from app.workers.celery_app import celery_app
import structlog

log = structlog.get_logger()

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60, name="app.workers.notification_tasks.send_verification_email_task")
def send_verification_email_task(self, user_id: str, raw_token: str):
    """Send email verification link to user."""
    async def _send():
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from sqlalchemy import select
        import uuid
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
            user = result.scalar_one_or_none()
            if user:
                from app.services.email_service import email_service
                await email_service.send_verification_email(user.email, f"{user.first_name} {user.last_name}", raw_token)
    try:
        asyncio.run(_send())
    except Exception as exc:
        log.error("verification_email_failed", user_id=user_id, error=str(exc))
        raise self.retry(exc=exc)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60, name="app.workers.notification_tasks.send_reset_password_email_task")
def send_reset_password_email_task(self, user_id: str, raw_token: str):
    async def _send():
        from app.core.database import AsyncSessionLocal
        from app.models.user import User
        from sqlalchemy import select
        import uuid
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
            user = result.scalar_one_or_none()
            if user:
                from app.services.email_service import email_service
                await email_service.send_reset_password_email(user.email, f"{user.first_name} {user.last_name}", raw_token)
    try:
        asyncio.run(_send())
    except Exception as exc:
        raise self.retry(exc=exc)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60, name="app.workers.notification_tasks.send_invitation_email_task")
def send_invitation_email_task(self, org_id: str, to_email: str, raw_token: str):
    async def _send():
        from app.core.database import AsyncSessionLocal
        from app.models.organization import Organization
        from sqlalchemy import select
        import uuid
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
            org = result.scalar_one_or_none()
            if org:
                from app.services.email_service import email_service
                await email_service.send_invitation_email(to_email, org.name, "Your organization", raw_token)
    try:
        asyncio.run(_send())
    except Exception as exc:
        raise self.retry(exc=exc)

@celery_app.task(name="app.workers.notification_tasks.send_notification_email_task")
def send_notification_email_task(user_id: str, title: str, message: str):
    log.info("notification_email_queued", user_id=user_id, title=title)
