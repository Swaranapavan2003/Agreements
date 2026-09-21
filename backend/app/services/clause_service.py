import uuid
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.clause_repository import ClauseRepository
from app.schemas.clause import ClauseCreate, ClauseUpdate
from app.models.template import Clause

class ClauseService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.repo = ClauseRepository(db, organization_id)

    async def get_clause(self, clause_id: uuid.UUID) -> Clause:
        return await self.repo.get_by_id(clause_id)

    async def list_clauses(self, page: int = 1, size: int = 20) -> Tuple[List[Clause], int]:
        return await self.repo.list_clauses(page, size)

    async def create_clause(self, user_id: uuid.UUID, data: ClauseCreate) -> Clause:
        # Additional validation can be added here
        return await self.repo.create(user_id, data)

    async def update_clause(self, clause_id: uuid.UUID, data: ClauseUpdate) -> Clause:
        # Additional validation can be added here
        return await self.repo.update(clause_id, data)

    async def delete_clause(self, clause_id: uuid.UUID) -> None:
        await self.repo.delete(clause_id)
