from __future__ import annotations
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import String, Boolean, JSON, UUID, ForeignKey, DateTime, Numeric, Date, BigInteger, Integer, UniqueConstraint, Index
from .base import Base, UUIDMixin, TimestampMixin
from typing import Optional
from datetime import datetime, date
from decimal import Decimal
import uuid

class Plan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "plans"
    
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    versions: Mapped[list["PlanVersion"]] = relationship("PlanVersion", back_populates="plan", lazy="selectin")

class PlanVersion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "plan_versions"
    __table_args__ = (
        UniqueConstraint("plan_id", "version", name="uq_plan_version"),
    )
    
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plans.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    features: Mapped[dict] = mapped_column(JSON, nullable=False)
    limits: Mapped[dict] = mapped_column(JSON, nullable=False)
    price_inr: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    plan: Mapped["Plan"] = relationship("Plan", back_populates="versions")

class Subscription(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "subscriptions"
    __table_args__ = (
        UniqueConstraint("organization_id", name="uq_org_subscription"),
    )
    
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    plan_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plan_versions.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    trial_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    plan: Mapped["Plan"] = relationship("Plan")
    plan_version: Mapped["PlanVersion"] = relationship("PlanVersion")

class Entitlement(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "entitlements"
    __table_args__ = (
        UniqueConstraint("organization_id", name="uq_org_entitlement"),
    )
    
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True)
    subscription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=False)
    features: Mapped[dict] = mapped_column(JSON, nullable=False)  # SNAPSHOT - never modified when plan changes
    limits: Mapped[dict] = mapped_column(JSON, nullable=False)     # SNAPSHOT - never modified when plan changes

class UsageRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "usage_records"
    __table_args__ = (
        UniqueConstraint("organization_id", "period_start", "period_end", name="uq_usage_period"),
        Index("idx_usage_org", "organization_id"),
    )
    
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    agreements_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    storage_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    ai_requests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    signature_requests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    api_requests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
