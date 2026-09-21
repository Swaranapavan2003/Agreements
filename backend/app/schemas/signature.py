from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import Optional

class SignatureCreate(BaseModel):
    agreement_id: uuid.UUID
    user_id: uuid.UUID
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class SignatureResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    agreement_id: uuid.UUID
    user_id: uuid.UUID
    cryptographic_hash: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
