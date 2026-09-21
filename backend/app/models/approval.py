import enum
import uuid
from sqlalchemy import String, Integer, Boolean, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, TimestampMixin, TenantMixin
from typing import Optional

class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class ApprovalWorkflow(TenantMixin, UUIDMixin, TimestampMixin, Base):
    __tablename__ = "approval_workflows"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class ApprovalStep(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "approval_steps"
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("approval_workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    role_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_parallel: Mapped[bool] = mapped_column(Boolean, default=False)

class ApprovalRequest(TenantMixin, UUIDMixin, TimestampMixin, Base):
    __tablename__ = "approval_requests"
    agreement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agreements.id", ondelete="CASCADE"), nullable=False, index=True)
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("approval_workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    current_step_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)

class ApprovalRecord(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "approval_records"
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    step_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("approval_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    comments: Mapped[Optional[str]] = mapped_column(String, nullable=True)
