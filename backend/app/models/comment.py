import uuid
import enum
from typing import Optional, List
from sqlalchemy import ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, UUIDMixin, TimestampMixin, SoftDeleteMixin

class CommentStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class Comment(Base, TenantMixin, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "comments"

    agreement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agreements.id", ondelete="CASCADE"), index=True)
    version_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("agreement_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(Text)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    status: Mapped[CommentStatusEnum] = mapped_column(SQLEnum(CommentStatusEnum), default=CommentStatusEnum.OPEN, nullable=False)
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    replies: Mapped[List["Comment"]] = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["Comment"]] = relationship("Comment", back_populates="replies", remote_side="[Comment.id]")
