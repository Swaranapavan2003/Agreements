from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.schemas.organization import OrganizationResponse, OrganizationUpdate, DepartmentCreate, DepartmentUpdate, DepartmentResponse, TeamCreate, TeamResponse, OrganizationSettingsUpdate
from app.schemas.common import APIResponse
from app.services.organization_service import OrganizationService
from app.models.user import User

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/me", response_model=APIResponse[OrganizationResponse])
async def get_my_org(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = OrganizationService(db)
    org = await svc.get_organization(current_user.organization_id)
    return {"success": True, "data": org}

@router.patch("/me", response_model=APIResponse[OrganizationResponse])
async def update_my_org(
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = OrganizationService(db)
    org = await svc.update_organization(current_user.organization_id, data, current_user.id)
    return {"success": True, "data": org}

@router.get("/me/departments", response_model=APIResponse[list[DepartmentResponse]])
async def get_departments(
    include_inactive: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = OrganizationService(db)
    depts = await svc.get_departments(current_user.organization_id, include_inactive)
    return {"success": True, "data": depts}

@router.post("/me/departments", response_model=APIResponse[DepartmentResponse])
async def create_department(
    data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = OrganizationService(db)
    dept = await svc.create_department(current_user.organization_id, data, current_user.id)
    return {"success": True, "data": dept}

@router.patch("/me/departments/{dept_id}", response_model=APIResponse[DepartmentResponse])
async def update_department(
    dept_id: uuid.UUID,
    data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = OrganizationService(db)
    dept = await svc.update_department(dept_id, current_user.organization_id, data, current_user.id)
    return {"success": True, "data": dept}

@router.delete("/me/departments/{dept_id}", response_model=APIResponse[dict])
async def delete_department(
    dept_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = OrganizationService(db)
    await svc.delete_department(dept_id, current_user.organization_id, current_user.id)
    return {"success": True, "data": {"message": "Department deleted"}}

@router.get("/me/settings", response_model=APIResponse[dict])
async def get_settings(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = OrganizationService(db)
    settings = await svc.get_settings(current_user.organization_id)
    return {"success": True, "data": settings}

@router.patch("/me/settings", response_model=APIResponse[dict])
async def update_settings(
    data: OrganizationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = OrganizationService(db)
    settings = await svc.update_settings(current_user.organization_id, data, current_user.id)
    return {"success": True, "data": settings}

@router.get("/me/teams", response_model=APIResponse[list[TeamResponse]])
async def get_teams(
    department_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = OrganizationService(db)
    teams = await svc.get_teams(current_user.organization_id, department_id)
    return {"success": True, "data": teams}

@router.post("/me/teams", response_model=APIResponse[TeamResponse])
async def create_team(
    data: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = OrganizationService(db)
    team = await svc.create_team(current_user.organization_id, data, current_user.id)
    return {"success": True, "data": team}
