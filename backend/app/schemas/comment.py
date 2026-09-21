from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional, List
from datetime import datetime
from app.models.comment import CommentStatusEnum

class CommentBase(BaseModel):
    text: str
    version_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    text: Optional[str] = None
    status: Optional[CommentStatusEnum] = None

class CommentResponse(CommentBase):
    id: uuid.UUID
    agreement_id: uuid.UUID
    author_id: uuid.UUID
    status: CommentStatusEnum
    resolved_by_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    replies: List["CommentResponse"] = []

    model_config = ConfigDict(from_attributes=True)

CommentResponse.model_rebuild()
