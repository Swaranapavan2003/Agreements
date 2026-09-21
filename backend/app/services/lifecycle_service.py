import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.agreement import Agreement, AgreementStatus
from app.models.audit import AuditLog
from app.repositories.agreement_repository import AgreementRepository
from app.core.exceptions import ConflictError

class LifecycleService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.db = db
        self.organization_id = organization_id
        self.ag_repo = AgreementRepository(db, organization_id)
        
    async def renew_agreement(self, agreement_id: uuid.UUID, new_expiry: date, user_id: uuid.UUID) -> Agreement:
        agreement = await self.ag_repo.get_by_id_tenant(Agreement, agreement_id)
        agreement.expiry_date = new_expiry
        
        log = AuditLog(
            organization_id=self.organization_id,
            user_id=user_id,
            action="RENEW_AGREEMENT",
            resource_type="AGREEMENT",
            resource_id=agreement_id,
            details={"new_expiry": new_expiry.isoformat()}
        )
        self.db.add(log)
        await self.db.flush()
        return agreement

    async def amend_agreement(self, agreement_id: uuid.UUID, user_id: uuid.UUID) -> Agreement:
        agreement = await self.ag_repo.get_by_id_tenant(Agreement, agreement_id)
        agreement.status = AgreementStatus.DRAFT
        
        log = AuditLog(
            organization_id=self.organization_id,
            user_id=user_id,
            action="AMEND_AGREEMENT",
            resource_type="AGREEMENT",
            resource_id=agreement_id
        )
        self.db.add(log)
        await self.db.flush()
        return agreement

    async def terminate_agreement(self, agreement_id: uuid.UUID, user_id: uuid.UUID) -> Agreement:
        agreement = await self.ag_repo.get_by_id_tenant(Agreement, agreement_id)
        agreement.status = AgreementStatus.TERMINATED
        
        log = AuditLog(
            organization_id=self.organization_id,
            user_id=user_id,
            action="TERMINATE_AGREEMENT",
            resource_type="AGREEMENT",
            resource_id=agreement_id
        )
        self.db.add(log)
        await self.db.flush()
        return agreement
