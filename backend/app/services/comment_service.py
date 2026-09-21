import uuid
from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.comment import Comment, CommentStatusEnum
from app.repositories.comment_repository import CommentRepository
from app.schemas.comment import CommentCreate, CommentUpdate
from app.core.exceptions import NotFoundError

class CommentService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.db = db
        self.repo = CommentRepository(db, organization_id)
        self.organization_id = organization_id

    async def get_threads(self, agreement_id: uuid.UUID) -> Sequence[Comment]:
        return await self.repo.get_threads_by_agreement(agreement_id)

    async def add_comment(self, agreement_id: uuid.UUID, author_id: uuid.UUID, schema: CommentCreate) -> Comment:
        comment = Comment(
            organization_id=self.organization_id,
            agreement_id=agreement_id,
            author_id=author_id,
            text=schema.text,
            version_id=schema.version_id,
            parent_id=schema.parent_id
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def reply_to_comment(self, agreement_id: uuid.UUID, parent_id: uuid.UUID, author_id: uuid.UUID, text: str) -> Comment:
        parent_comment = await self.repo.get_by_id_tenant(Comment, parent_id)
        if not parent_comment:
            raise NotFoundError("Parent comment not found")
            
        comment = Comment(
            organization_id=self.organization_id,
            agreement_id=agreement_id,
            author_id=author_id,
            text=text,
            parent_id=parent_id,
            version_id=parent_comment.version_id
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def resolve_comment(self, comment_id: uuid.UUID, user_id: uuid.UUID) -> Comment:
        comment = await self.repo.get_by_id_tenant(Comment, comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
            
        comment.status = CommentStatusEnum.RESOLVED
        comment.resolved_by_id = user_id
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def reopen_comment(self, comment_id: uuid.UUID) -> Comment:
        comment = await self.repo.get_by_id_tenant(Comment, comment_id)
        if not comment:
            raise NotFoundError("Comment not found")
            
        comment.status = CommentStatusEnum.OPEN
        comment.resolved_by_id = None
        await self.db.commit()
        await self.db.refresh(comment)
        return comment
