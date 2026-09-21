import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.models.user import User
from app.models.agreement import AgreementVersion
from app.schemas.common import APIResponse
from app.services.versioning_service import VersioningService

router = APIRouter(prefix="/versions", tags=["Versions"])

class CompareRequest(BaseModel):
    version_1_id: uuid.UUID
    version_2_id: uuid.UUID
    format: str = "html"
    generate_ai_summary: bool = False

class CompareResponse(BaseModel):
    diff: str
    ai_summary: Optional[str] = None

async def _get_version_text(db: AsyncSession, version_id: uuid.UUID) -> str:
    result = await db.execute(select(AgreementVersion).where(AgreementVersion.id == version_id))
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail=f"Version {version_id} not found")
    
    # In a real scenario, this would download and extract text from version.file_url.
    # For now, we simulate fetching the text.
    return f"Simulated text content for version {version_id} at {version.file_url}"

@router.post("/compare", response_model=APIResponse[CompareResponse])
async def compare_versions(
    request: CompareRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.read"))
):
    text_v1 = await _get_version_text(db, request.version_1_id)
    text_v2 = await _get_version_text(db, request.version_2_id)
    
    svc = VersioningService()
    diff = svc.compare_versions(text_v1, text_v2, request.format)
    
    ai_summary = None
    if request.generate_ai_summary:
        ai_summary = await svc.generate_ai_summary(text_v1, text_v2)
        
    return APIResponse(data=CompareResponse(diff=diff, ai_summary=ai_summary))
