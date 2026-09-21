import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.schemas.agreement import (
    AgreementCreate, AgreementUpdate, AgreementResponse, 
    AgreementPartyCreate, AgreementVersionResponse, AgreementPartyResponse
)
from app.schemas.common import APIResponse, PaginatedData
from app.models.user import User
from app.models.agreement import AgreementStatus
from app.services.agreement_service import AgreementService

router = APIRouter(prefix="/agreements", tags=["Agreements"])

@router.get("", response_model=APIResponse[PaginatedData[AgreementResponse]])
async def list_agreements(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.read"))
):
    svc = AgreementService(db, current_user.organization_id)
    agreements, total = await svc.list_agreements(page, per_page)
    pages = (total + per_page - 1) // per_page
    
    items = [AgreementResponse.model_validate(a) for a in agreements]
    return {"success": True, "data": {"items": items, "total": total, "page": page, "per_page": per_page, "pages": pages}}

@router.post("", response_model=APIResponse[AgreementResponse])
async def create_agreement(
    data: AgreementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.create"))
):
    svc = AgreementService(db, current_user.organization_id)
    agreement = await svc.create_agreement(data, current_user.id)
    return {"success": True, "data": AgreementResponse.model_validate(agreement)}

@router.get("/{id}", response_model=APIResponse[AgreementResponse])
async def get_agreement(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.read"))
):
    svc = AgreementService(db, current_user.organization_id)
    agreement = await svc.get_agreement(id)
    return {"success": True, "data": AgreementResponse.model_validate(agreement)}

@router.patch("/{id}", response_model=APIResponse[AgreementResponse])
async def update_agreement(
    id: uuid.UUID,
    data: AgreementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = AgreementService(db, current_user.organization_id)
    agreement = await svc.update_agreement(id, data, current_user.id)
    return {"success": True, "data": AgreementResponse.model_validate(agreement)}

class StateTransitionRequest(BaseModel):
    status: AgreementStatus

@router.post("/{id}/state", response_model=APIResponse[AgreementResponse])
async def transition_state(
    id: uuid.UUID,
    req: StateTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = AgreementService(db, current_user.organization_id)
    agreement = await svc.transition_state(id, req.status, current_user.id)
    return {"success": True, "data": AgreementResponse.model_validate(agreement)}

@router.post("/{id}/parties", response_model=APIResponse[AgreementPartyResponse])
async def add_party(
    id: uuid.UUID,
    data: AgreementPartyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = AgreementService(db, current_user.organization_id)
    party = await svc.add_party(id, data, current_user.id)
    return {"success": True, "data": AgreementPartyResponse.model_validate(party)}

@router.post("/{id}/versions", response_model=APIResponse[AgreementVersionResponse])
async def upload_version(
    id: uuid.UUID,
    file: UploadFile = File(...),
    change_summary: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = AgreementService(db, current_user.organization_id)
    version = await svc.upload_version(id, file, change_summary, current_user.id)
    return {"success": True, "data": AgreementVersionResponse.model_validate(version)}
