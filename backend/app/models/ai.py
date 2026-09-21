from typing import List
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
import uuid
from app.models.base import Base, UUIDMixin, TimestampMixin, TenantMixin

class DocumentChunk(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "document_chunks"

    agreement_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agreements.id", ondelete="CASCADE"), index=True, nullable=False
    )
    version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("agreement_versions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=True)
    embedding: Mapped[List[float]] = mapped_column(Vector(1536), nullable=True)
