import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import TenantRepository
from app.models.agreement import Agreement, AgreementVersion, AgreementParty
from app.core.exceptions import NotFoundError

class AgreementRepository(TenantRepository):
    async def get_by_id_with_relations(self, agreement_id: uuid.UUID) -> Agreement:
        stmt = select(Agreement).options(
            selectinload(Agreement.versions),
            selectinload(Agreement.parties)
        ).where(
            Agreement.id == agreement_id,
            self.tenant_filter(Agreement)
        )
        result = await self.db.execute(stmt)
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundError("Agreement not found")
        return obj

    async def list_agreements(self, page: int = 1, size: int = 50) -> Tuple[List[Agreement], int]:
        count_stmt = select(Agreement).where(self.tenant_filter(Agreement))
        # Note: We can use self.count if we adjust it to not select func.count if we use scalar
        total = await self.count(Agreement)
        
        stmt = select(Agreement).options(
            selectinload(Agreement.versions),
            selectinload(Agreement.parties)
        ).where(
            self.tenant_filter(Agreement)
        )
        
        stmt = self.apply_pagination(stmt, page, size)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        
        return list(items), total

    async def create_agreement(self, agreement: Agreement) -> Agreement:
        self.db.add(agreement)
        await self.db.flush()
        return agreement

    async def create_version(self, version: AgreementVersion) -> AgreementVersion:
        self.db.add(version)
        await self.db.flush()
        return version

    async def add_party(self, party: AgreementParty) -> AgreementParty:
        self.db.add(party)
        await self.db.flush()
        return party
