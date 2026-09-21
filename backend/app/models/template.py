from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Boolean, ForeignKey, UUID
from typing import List
import uuid

from app.models.base import Base, TenantMixin, UUIDMixin, TimestampMixin, SoftDeleteMixin

class Template(Base, TenantMixin, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "templates"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    html_content: Mapped[str] = mapped_column(Text, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    fields: Mapped[List["TemplateField"]] = relationship("TemplateField", back_populates="template", cascade="all, delete-orphan")


class TemplateField(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "template_fields"

    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("templates.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    template: Mapped["Template"] = relationship("Template", back_populates="fields")


class Clause(Base, TenantMixin, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "clauses"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_standard: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
