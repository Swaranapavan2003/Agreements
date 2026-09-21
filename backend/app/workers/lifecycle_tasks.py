import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from celery import shared_task
from app.core.database import SessionLocal
from app.models.agreement import Agreement, RenewalType, AgreementStatus
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService

@shared_task
def check_expiring_agreements():
    import asyncio
    asyncio.run(_check_expiring_agreements_async())

async def _check_expiring_agreements_async():
    async with SessionLocal() as db:
        today = datetime.date.today()
        # simplified check
        stmt = select(Agreement).where(
            Agreement.status.in_([AgreementStatus.ACTIVE, AgreementStatus.SIGNED]),
            Agreement.expiry_date != None
        )
        res = await db.execute(stmt)
        agreements = res.scalars().all()
        
        for ag in agreements:
            if not ag.notice_period_days:
                continue
            delta = (ag.expiry_date - today).days
            if 0 < delta <= ag.notice_period_days:
                if ag.renewal_type == RenewalType.AUTO:
                    ag.expiry_date = ag.expiry_date + datetime.timedelta(days=365)
                    await db.flush()
                else:
                    # Notify
                    email_svc = EmailService() # mock or init properly
                    notif_svc = NotificationService(db, ag.organization_id)
                    # Implementation depends on services
                    pass
        await db.commit()
