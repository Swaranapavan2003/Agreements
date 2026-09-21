import uuid
from typing import Optional, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.schemas.template import (
    TemplateCreate, TemplateUpdate, TemplateResponse
)
from app.schemas.common import APIResponse, PaginatedData
from app.models.user import User
from app.services.template_service import TemplateService

router = APIRouter(prefix="/templates", tags=["Templates"])

@router.get("", response_model=APIResponse[PaginatedData[TemplateResponse]])
async def list_templates(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("template.read"))
):
    svc = TemplateService(db, current_user.organization_id)
    templates, total = await svc.list_templates(page, per_page)
    pages = (total + per_page - 1) // per_page
    
    items = [TemplateResponse.model_validate(t) for t in templates]
    return {"success": True, "data": {"items": items, "total": total, "page": page, "per_page": per_page, "pages": pages}}

@router.post("", response_model=APIResponse[TemplateResponse])
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("template.manage"))
):
    svc = TemplateService(db, current_user.organization_id)
    template = await svc.create_template(current_user.id, data)
    return {"success": True, "data": TemplateResponse.model_validate(template)}

@router.get("/{id}", response_model=APIResponse[TemplateResponse])
async def get_template(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("template.read"))
):
    svc = TemplateService(db, current_user.organization_id)
    template = await svc.get_template(id)
    return {"success": True, "data": TemplateResponse.model_validate(template)}

@router.patch("/{id}", response_model=APIResponse[TemplateResponse])
async def update_template(
    id: uuid.UUID,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("template.manage"))
):
    svc = TemplateService(db, current_user.organization_id)
    template = await svc.update_template(id, data)
    return {"success": True, "data": TemplateResponse.model_validate(template)}

@router.delete("/{id}", response_model=APIResponse[dict])
async def delete_template(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("template.manage"))
):
    svc = TemplateService(db, current_user.organization_id)
    await svc.delete_template(id)
    return {"success": True, "data": {"message": "Template deleted successfully"}}
