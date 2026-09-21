from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.schemas.user import UserResponse, UserUpdate, InviteUserRequest, AssignRoleRequest, RoleResponse
from app.schemas.common import APIResponse, PaginatedData
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=APIResponse[PaginatedData[UserResponse]])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = UserService(db)
    users, total, pages = await svc.get_users(current_user.organization_id, page, per_page, search, is_active)
    from app.schemas.user import RoleResponse
    items = []
    for u in users:
        ur = UserResponse.model_validate(u)
        ur.roles = [RoleResponse.from_orm_role(r.role) for r in u.user_roles]
        items.append(ur)
    return {"success": True, "data": {"items": items, "total": total, "page": page, "per_page": per_page, "pages": pages}}

@router.get("/me", response_model=APIResponse[UserResponse])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    from app.schemas.user import RoleResponse
    resp = UserResponse.model_validate(current_user)
    resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in current_user.user_roles]
    return {"success": True, "data": resp}

@router.patch("/me", response_model=APIResponse[UserResponse])
async def update_my_profile(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = UserService(db)
    user = await svc.update_user(current_user.id, current_user.organization_id, data, current_user.id)
    from app.schemas.user import RoleResponse
    resp = UserResponse.model_validate(user)
    resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in user.user_roles]
    return {"success": True, "data": resp}

@router.post("/invite", response_model=APIResponse[dict])
async def invite_user(
    req: InviteUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    result = await svc.invite_user(current_user.organization_id, req, current_user.id)
    return {"success": True, "data": result}

@router.get("/{user_id}", response_model=APIResponse[UserResponse])
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = UserService(db)
    user = await svc.get_user(user_id, current_user.organization_id)
    from app.schemas.user import RoleResponse
    resp = UserResponse.model_validate(user)
    resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in user.user_roles]
    return {"success": True, "data": resp}

@router.patch("/{user_id}", response_model=APIResponse[UserResponse])
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    user = await svc.update_user(user_id, current_user.organization_id, data, current_user.id)
    from app.schemas.user import RoleResponse
    resp = UserResponse.model_validate(user)
    resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in user.user_roles]
    return {"success": True, "data": resp}

@router.post("/{user_id}/activate", response_model=APIResponse[UserResponse])
async def activate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    user = await svc.activate_user(user_id, current_user.organization_id, current_user.id)
    from app.schemas.user import RoleResponse
    resp = UserResponse.model_validate(user)
    resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in user.user_roles]
    return {"success": True, "data": resp}

@router.post("/{user_id}/deactivate", response_model=APIResponse[UserResponse])
async def deactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    user = await svc.deactivate_user(user_id, current_user.organization_id, current_user.id)
    from app.schemas.user import RoleResponse
    resp = UserResponse.model_validate(user)
    resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in user.user_roles]
    return {"success": True, "data": resp}

@router.get("/{user_id}/roles", response_model=APIResponse[list[RoleResponse]])
async def get_user_roles(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = UserService(db)
    user = await svc.get_user(user_id, current_user.organization_id)
    from app.schemas.user import RoleResponse
    roles = [RoleResponse.from_orm_role(ur.role) for ur in user.user_roles]
    return {"success": True, "data": roles}

@router.post("/{user_id}/roles", response_model=APIResponse[dict])
async def assign_role(
    user_id: uuid.UUID,
    req: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    await svc.assign_role(user_id, req.role_id, current_user.organization_id, current_user.id)
    return {"success": True, "data": {"message": "Role assigned"}}

@router.delete("/{user_id}/roles/{role_id}", response_model=APIResponse[dict])
async def remove_role(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    await svc.remove_role(user_id, role_id, current_user.organization_id, current_user.id)
    return {"success": True, "data": {"message": "Role removed"}}
