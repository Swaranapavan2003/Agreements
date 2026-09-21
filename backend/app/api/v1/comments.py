import uuid
from typing import List
from fastapi import APIRouter, Depends, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.common import APIResponse
from app.services.comment_service import CommentService

router = APIRouter(prefix="", tags=["Comments"])

@router.get("/agreements/{agreement_id}/comments", response_model=APIResponse[List[CommentResponse]])
async def list_comments(
    agreement_id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.read"))
):
    svc = CommentService(db, current_user.organization_id)
    threads = await svc.get_threads(agreement_id)
    return APIResponse(data=threads)

@router.post("/agreements/{agreement_id}/comments", response_model=APIResponse[CommentResponse])
async def create_comment(
    agreement_id: uuid.UUID = Path(...),
    schema: CommentCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = CommentService(db, current_user.organization_id)
    if schema.parent_id:
        comment = await svc.reply_to_comment(agreement_id, schema.parent_id, current_user.id, schema.text)
    else:
        comment = await svc.add_comment(agreement_id, current_user.id, schema)
    return APIResponse(data=comment)

@router.patch("/comments/{id}/resolve", response_model=APIResponse[CommentResponse])
async def resolve_comment(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = CommentService(db, current_user.organization_id)
    comment = await svc.resolve_comment(id, current_user.id)
    return APIResponse(data=comment)

@router.patch("/comments/{id}/reopen", response_model=APIResponse[CommentResponse])
async def reopen_comment(
    id: uuid.UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("agreement.update"))
):
    svc = CommentService(db, current_user.organization_id)
    comment = await svc.reopen_comment(id)
    return APIResponse(data=comment)
