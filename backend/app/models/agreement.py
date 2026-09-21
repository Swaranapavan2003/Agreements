from __future__ import annotations
import enum
import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, DateTime, Date, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDMixin, TimestampMixin, TenantMixin, SoftDeleteMixin

class AgreementStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    SIGNED = "SIGNED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"

class RenewalType(str, enum.Enum):
    MANUAL = "MANUAL"
    AUTO = "AUTO"

class Agreement(TenantMixin, UUIDMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "agreements"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[AgreementStatus] = mapped_column(Enum(AgreementStatus), default=AgreementStatus.DRAFT, nullable=False)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    renewal_type: Mapped[RenewalType] = mapped_column(Enum(RenewalType), default=RenewalType.MANUAL, nullable=False)
    notice_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSON, nullable=True)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    versions: Mapped[List["AgreementVersion"]] = relationship(
        "AgreementVersion", back_populates="agreement", cascade="all, delete-orphan", lazy="selectin"
    )
    parties: Mapped[List["AgreementParty"]] = relationship(
        "AgreementParty", back_populates="agreement", cascade="all, delete-orphan", lazy="selectin"
    )

class AgreementVersion(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "agreement_versions"

    agreement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agreements.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    change_summary: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    agreement: Mapped["Agreement"] = relationship("Agreement", back_populates="versions")

class AgreementParty(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "agreement_parties"

    agreement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agreements.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False) # internal/external
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    agreement: Mapped["Agreement"] = relationship("Agreement", back_populates="parties")
