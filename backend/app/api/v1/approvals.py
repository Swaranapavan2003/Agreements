import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_permission
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.approval import ApprovalWorkflowCreate, ApprovalWorkflowResponse, ApprovalRequestResponse, ApprovalRecordResponse
from app.services.approval_service import ApprovalService
from app.models.approval import ApprovalStatus
from pydantic import BaseModel

router = APIRouter(prefix="/approvals", tags=["Approvals"])

@router.post("/workflows", response_model=APIResponse[ApprovalWorkflowResponse])
async def create_workflow(
    data: ApprovalWorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approval.manage"))
):
    svc = ApprovalService(db, current_user.organization_id)
    wf = await svc.create_workflow(data)
    return {"success": True, "data": ApprovalWorkflowResponse.model_validate(wf)}

@router.post("/requests/{agreement_id}/{workflow_id}", response_model=APIResponse[ApprovalRequestResponse])
async def start_approval(
    agreement_id: uuid.UUID,
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approval.start"))
):
    svc = ApprovalService(db, current_user.organization_id)
    req = await svc.start_approval(agreement_id, workflow_id)
    return {"success": True, "data": ApprovalRequestResponse.model_validate(req)}

class SubmitApprovalData(BaseModel):
    status: ApprovalStatus
    comments: str = None

@router.post("/requests/{request_id}/submit", response_model=APIResponse[ApprovalRecordResponse])
async def submit_approval(
    request_id: uuid.UUID,
    data: SubmitApprovalData,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("approval.submit"))
):
    svc = ApprovalService(db, current_user.organization_id)
    rec = await svc.submit_approval(request_id, current_user.id, data.status, data.comments)
    return {"success": True, "data": ApprovalRecordResponse.model_validate(rec)}
