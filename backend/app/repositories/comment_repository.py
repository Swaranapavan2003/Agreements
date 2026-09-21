import uuid
from typing import List, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import TenantRepository
from app.models.comment import Comment

class CommentRepository(TenantRepository):
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        super().__init__(db, organization_id)
        
    async def get_threads_by_agreement(self, agreement_id: uuid.UUID) -> Sequence[Comment]:
        """Fetch top-level comments and their replies for an agreement."""
        stmt = select(Comment).where(
            Comment.agreement_id == agreement_id,
            Comment.parent_id.is_(None),
            self.tenant_filter(Comment)
        ).options(selectinload(Comment.replies).selectinload(Comment.replies)).order_by(Comment.created_at.asc())
        
        result = await self.db.execute(stmt)
        return result.scalars().all()
