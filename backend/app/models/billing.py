from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin, TenantMixin

class Plan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "billing_plans"

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    stripe_price_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    features: Mapped[dict] = mapped_column(JSON, default=dict)

class Subscription(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "billing_subscriptions"

    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("billing_plans.id"), nullable=False)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="inactive")
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    plan: Mapped["Plan"] = relationship("Plan")

class UsageRecord(Base, UUIDMixin, TimestampMixin, TenantMixin):
    __tablename__ = "billing_usage_records"

    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
