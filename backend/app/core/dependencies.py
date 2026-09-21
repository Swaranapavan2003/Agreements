from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import verify_access_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.models.user import User, UserRole, RolePermission, Permission, Role
from app.models.organization import Organization

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise AuthenticationError()
    payload = verify_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload", "INVALID_TOKEN")
    
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id), User.is_deleted == False)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise AuthenticationError("User not found", "USER_NOT_FOUND")
    if not user.is_active:
        raise AuthenticationError("Account is deactivated", "ACCOUNT_INACTIVE")
    return user

async def get_current_org(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Organization:
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise AuthenticationError("Organization not found", "ORG_NOT_FOUND")
    return org

async def _get_user_permissions(user_id: uuid.UUID, org_id: uuid.UUID, db: AsyncSession) -> set[str]:
    result = await db.execute(
        select(Permission.name)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id, UserRole.organization_id == org_id)
    )
    return {row[0] for row in result.fetchall()}

def require_permission(*permissions: str):
    """Dependency factory that checks user has at least one of the listed permissions."""
    async def checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        if current_user.is_superadmin:
            return current_user
        user_permissions = await _get_user_permissions(current_user.id, current_user.organization_id, db)
        if not any(p in user_permissions for p in permissions):
            raise PermissionDeniedError(f"Required permission: {' or '.join(permissions)}")
        return current_user
    return checker

async def get_request_metadata(request: Request) -> dict:
    forwarded = request.headers.get("X-Forwarded-For")
    ip = forwarded.split(",")[0].strip() if forwarded else request.client.host if request.client else "unknown"
    return {"ip_address": ip, "user_agent": request.headers.get("User-Agent", "")}
