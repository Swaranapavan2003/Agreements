import uuid
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_permission
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.agreement import AgreementResponse
from app.services.lifecycle_service import LifecycleService
from pydantic import BaseModel

router = APIRouter(prefix="/lifecycle", tags=["Lifecycle"])

class RenewData(BaseModel):
    new_expiry: date

@router.post("/{agreement_id}/renew", response_model=APIResponse[AgreementResponse])
async def renew_agreement(
    agreement_id: uuid.UUID,
    data: RenewData,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("lifecycle.manage"))
):
    svc = LifecycleService(db, current_user.organization_id)
    ag = await svc.renew_agreement(agreement_id, data.new_expiry, current_user.id)
    return {"success": True, "data": AgreementResponse.model_validate(ag)}

@router.post("/{agreement_id}/amend", response_model=APIResponse[AgreementResponse])
async def amend_agreement(
    agreement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("lifecycle.manage"))
):
    svc = LifecycleService(db, current_user.organization_id)
    ag = await svc.amend_agreement(agreement_id, current_user.id)
    return {"success": True, "data": AgreementResponse.model_validate(ag)}

@router.post("/{agreement_id}/terminate", response_model=APIResponse[AgreementResponse])
async def terminate_agreement(
    agreement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("lifecycle.manage"))
):
    svc = LifecycleService(db, current_user.organization_id)
    ag = await svc.terminate_agreement(agreement_id, current_user.id)
    return {"success": True, "data": AgreementResponse.model_validate(ag)}
