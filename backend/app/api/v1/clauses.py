import uuid
from typing import Optional, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.schemas.clause import (
    ClauseCreate, ClauseUpdate, ClauseResponse
)
from app.schemas.common import APIResponse, PaginatedData
from app.models.user import User
from app.services.clause_service import ClauseService

router = APIRouter(prefix="/clauses", tags=["Clauses"])

@router.get("", response_model=APIResponse[PaginatedData[ClauseResponse]])
async def list_clauses(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clause.read"))
):
    svc = ClauseService(db, current_user.organization_id)
    clauses, total = await svc.list_clauses(page, per_page)
    pages = (total + per_page - 1) // per_page
    
    items = [ClauseResponse.model_validate(c) for c in clauses]
    return {"success": True, "data": {"items": items, "total": total, "page": page, "per_page": per_page, "pages": pages}}

@router.post("", response_model=APIResponse[ClauseResponse])
async def create_clause(
    data: ClauseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clause.manage"))
):
    svc = ClauseService(db, current_user.organization_id)
    clause = await svc.create_clause(current_user.id, data)
    return {"success": True, "data": ClauseResponse.model_validate(clause)}

@router.get("/{id}", response_model=APIResponse[ClauseResponse])
async def get_clause(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clause.read"))
):
    svc = ClauseService(db, current_user.organization_id)
    clause = await svc.get_clause(id)
    return {"success": True, "data": ClauseResponse.model_validate(clause)}

@router.patch("/{id}", response_model=APIResponse[ClauseResponse])
async def update_clause(
    id: uuid.UUID,
    data: ClauseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clause.manage"))
):
    svc = ClauseService(db, current_user.organization_id)
    clause = await svc.update_clause(id, data)
    return {"success": True, "data": ClauseResponse.model_validate(clause)}

@router.delete("/{id}", response_model=APIResponse[dict])
async def delete_clause(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("clause.manage"))
):
    svc = ClauseService(db, current_user.organization_id)
    await svc.delete_clause(id)
    return {"success": True, "data": {"message": "Clause deleted successfully"}}
