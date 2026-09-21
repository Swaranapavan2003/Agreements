import uuid
import hashlib
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.signature import Signature
from app.models.agreement import Agreement, AgreementStatus
from app.schemas.signature import SignatureCreate
from app.repositories.signature_repository import SignatureRepository
from app.repositories.agreement_repository import AgreementRepository
from app.core.exceptions import ConflictError

class SignatureService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.db = db
        self.organization_id = organization_id
        self.repo = SignatureRepository(db, organization_id)
        self.ag_repo = AgreementRepository(db, organization_id)
        
    async def sign_agreement(self, agreement_id: uuid.UUID, user_id: uuid.UUID, ip_address: str, user_agent: str) -> Signature:
        agreement = await self.ag_repo.get_by_id_tenant(Agreement, agreement_id)
        if agreement.status != AgreementStatus.APPROVED:
            raise ConflictError("Agreement must be in APPROVED state to sign.")
            
        timestamp = datetime.utcnow().isoformat()
        raw_hash = f"{agreement_id}:{user_id}:{timestamp}".encode('utf-8')
        crypto_hash = hashlib.sha256(raw_hash).hexdigest()
        
        sig = Signature(
            organization_id=self.organization_id,
            agreement_id=agreement_id,
            user_id=user_id,
            cryptographic_hash=crypto_hash,
            ip_address=ip_address,
            user_agent=user_agent
        )
        sig = await self.repo.create_signature(sig)
        
        agreement.status = AgreementStatus.SIGNED
        await self.db.flush()
        return sig
