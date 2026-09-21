from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class NotificationResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    type: str
    event: str
    resource_type: Optional[str] = None
    resource_id: Optional[uuid.UUID] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class UnreadCountResponse(BaseModel):
    count: int
