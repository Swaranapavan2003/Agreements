from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ClauseBase(BaseModel):
    name: str
    text: str
    category: Optional[str] = None
    is_standard: bool = False

class ClauseCreate(ClauseBase):
    pass

class ClauseUpdate(BaseModel):
    name: Optional[str] = None
    text: Optional[str] = None
    category: Optional[str] = None
    is_standard: Optional[bool] = None

class ClauseResponse(ClauseBase):
    id: UUID
    organization_id: UUID
    created_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ClausePaginatedResponse(BaseModel):
    items: List[ClauseResponse]
    total: int
    page: int
    size: int
    
    model_config = ConfigDict(from_attributes=True)
