from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List, Tuple
import uuid

from app.repositories.base import TenantRepository
from app.models.template import Clause
from app.schemas.clause import ClauseCreate, ClauseUpdate

class ClauseRepository(TenantRepository):
    async def get_by_id(self, clause_id: uuid.UUID) -> Clause:
        stmt = (
            select(Clause)
            .where(
                Clause.id == clause_id,
                self.tenant_filter(Clause),
                Clause.is_deleted == False
            )
        )
        result = await self.db.execute(stmt)
        obj = result.scalar_one_or_none()
        if not obj:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Clause not found")
        return obj

    async def list_clauses(self, page: int = 1, size: int = 20) -> Tuple[List[Clause], int]:
        filters = [Clause.is_deleted == False]
        total = await self.count(Clause, *filters)
        
        stmt = (
            select(Clause)
            .where(self.tenant_filter(Clause), *filters)
            .order_by(Clause.created_at.desc())
        )
        stmt = self.apply_pagination(stmt, page, size)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, user_id: uuid.UUID, data: ClauseCreate) -> Clause:
        clause = Clause(
            organization_id=self.organization_id,
            created_by_id=user_id,
            name=data.name,
            text=data.text,
            category=data.category,
            is_standard=data.is_standard
        )
        self.db.add(clause)
        await self.db.flush()
        return clause

    async def update(self, clause_id: uuid.UUID, data: ClauseUpdate) -> Clause:
        clause = await self.get_by_id(clause_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(clause, field, value)
            
        await self.db.flush()
        return clause

    async def delete(self, clause_id: uuid.UUID) -> None:
        clause = await self.get_by_id(clause_id)
        clause.is_deleted = True
        import datetime
        clause.deleted_at = datetime.datetime.now(datetime.timezone.utc)
        await self.db.flush()
