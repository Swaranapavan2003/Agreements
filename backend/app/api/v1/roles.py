from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.schemas.user import RoleResponse, PermissionResponse, CreateRoleRequest, UpdateRoleRequest, AssignRoleRequest
from app.schemas.common import APIResponse
from app.services.user_service import UserService
from app.models.user import User, Role
from app.core.exceptions import PermissionDeniedError, NotFoundError
from sqlalchemy import select

router = APIRouter(prefix="/roles", tags=["Roles"])

@router.get("", response_model=APIResponse[list[RoleResponse]])
async def list_roles(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = UserService(db)
    roles = await svc.get_roles(current_user.organization_id)
    return {"success": True, "data": [RoleResponse.from_orm_role(r) for r in roles]}

@router.get("/permissions", response_model=APIResponse[list[PermissionResponse]])
async def list_permissions(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = UserService(db)
    perms = await svc.get_all_permissions()
    return {"success": True, "data": [PermissionResponse.model_validate(p) for p in perms]}

@router.post("", response_model=APIResponse[RoleResponse])
async def create_role(
    req: CreateRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("user.manage"))
):
    svc = UserService(db)
    role = await svc.create_role(current_user.organization_id, req, current_user.id)
    return {"success": True, "data": RoleResponse.from_orm_role(role)}

@router.get("/{role_id}", response_model=APIResponse[RoleResponse])
async def get_role(role_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise NotFoundError("Role not found")
    return {"success": True, "data": RoleResponse.from_orm_role(role)}
