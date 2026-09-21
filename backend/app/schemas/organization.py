from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime
import uuid

class AddressSchema(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    email: str
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[dict] = None
    logo_url: Optional[str] = None
    is_active: bool
    settings: dict
    created_at: datetime
    model_config = {"from_attributes": True}

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[AddressSchema] = None
    logo_url: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    head_user_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    head_user_id: Optional[uuid.UUID] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    head_user_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None

class TeamResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class TeamCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    department_id: Optional[uuid.UUID] = None

class OrganizationSettingsUpdate(BaseModel):
    agreement_number_prefix: Optional[str] = None
    agreement_number_format: Optional[str] = None
    default_currency: Optional[str] = None
    timezone: Optional[str] = None
    notification_preferences: Optional[dict] = None
