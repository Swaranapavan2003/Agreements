from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import Optional, List
from app.models.approval import ApprovalStatus

class ApprovalWorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ApprovalWorkflowResponse(ApprovalWorkflowCreate):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ApprovalStepCreate(BaseModel):
    workflow_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    role_id: Optional[uuid.UUID] = None
    step_order: int
    is_parallel: bool = False

class ApprovalStepResponse(ApprovalStepCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ApprovalRequestCreate(BaseModel):
    agreement_id: uuid.UUID
    workflow_id: uuid.UUID

class ApprovalRequestResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    agreement_id: uuid.UUID
    workflow_id: uuid.UUID
    current_step_order: int
    status: ApprovalStatus
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ApprovalRecordCreate(BaseModel):
    request_id: uuid.UUID
    step_id: uuid.UUID
    user_id: uuid.UUID
    status: ApprovalStatus
    comments: Optional[str] = None

class ApprovalRecordResponse(ApprovalRecordCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
