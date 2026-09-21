import uuid
from sqlalchemy import select
from app.repositories.base import TenantRepository
from app.models.signature import Signature

class SignatureRepository(TenantRepository):
    async def create_signature(self, signature: Signature) -> Signature:
        self.db.add(signature)
        await self.db.flush()
        return signature
    
    async def get_signatures_for_agreement(self, agreement_id: uuid.UUID) -> list[Signature]:
        stmt = select(Signature).where(
            Signature.agreement_id == agreement_id,
            self.tenant_filter(Signature)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
