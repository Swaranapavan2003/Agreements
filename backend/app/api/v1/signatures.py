import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import require_permission
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.signature import SignatureResponse
from app.services.signature_service import SignatureService

router = APIRouter(prefix="/signatures", tags=["Signatures"])

@router.post("/{agreement_id}/sign", response_model=APIResponse[SignatureResponse])
async def sign_agreement(
    agreement_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("signature.sign"))
):
    svc = SignatureService(db, current_user.organization_id)
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    sig = await svc.sign_agreement(agreement_id, current_user.id, ip_address, user_agent)
    return {"success": True, "data": SignatureResponse.model_validate(sig)}
