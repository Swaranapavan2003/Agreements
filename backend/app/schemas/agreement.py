from typing import Optional, List, Dict, Any
from datetime import date, datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field
from app.models.agreement import AgreementStatus, RenewalType

class AgreementVersionResponse(BaseModel):
    id: uuid.UUID
    agreement_id: uuid.UUID
    version_number: int
    file_url: str
    created_by_id: Optional[uuid.UUID]
    change_summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AgreementPartyCreate(BaseModel):
    name: str
    entity_type: str = Field(..., description="internal or external")
    contact_email: Optional[str] = None
    signed_at: Optional[datetime] = None

class AgreementPartyResponse(AgreementPartyCreate):
    id: uuid.UUID
    agreement_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AgreementCreate(BaseModel):
    title: str
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    renewal_type: RenewalType = RenewalType.MANUAL
    notice_period_days: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None

class AgreementUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[AgreementStatus] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    renewal_type: Optional[RenewalType] = None
    notice_period_days: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None

class AgreementResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    status: AgreementStatus
    effective_date: Optional[date]
    expiry_date: Optional[date]
    renewal_type: RenewalType
    notice_period_days: Optional[int]
    metadata_json: Optional[Dict[str, Any]]
    created_by_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime
    
    versions: List[AgreementVersionResponse] = []
    parties: List[AgreementPartyResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PaginatedAgreementResponse(BaseModel):
    items: List[AgreementResponse]
    total: int
    page: int
    size: int
