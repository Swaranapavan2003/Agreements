from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class TemplateFieldBase(BaseModel):
    name: str
    type: str
    is_required: bool = False

class TemplateFieldCreate(TemplateFieldBase):
    pass

class TemplateFieldUpdate(TemplateFieldBase):
    pass

class TemplateFieldResponse(TemplateFieldBase):
    id: UUID
    template_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    html_content: str
    is_published: bool = False

class TemplateCreate(TemplateBase):
    fields: Optional[List[TemplateFieldCreate]] = None

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    html_content: Optional[str] = None
    is_published: Optional[bool] = None

class TemplateResponse(TemplateBase):
    id: UUID
    organization_id: UUID
    created_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    fields: List[TemplateFieldResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class TemplatePaginatedResponse(BaseModel):
    items: List[TemplateResponse]
    total: int
    page: int
    size: int
    
    model_config = ConfigDict(from_attributes=True)
