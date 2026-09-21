from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from app.repositories.user_repository import UserRepository
from app.repositories.organization_repository import OrganizationRepository
from app.models.user import User, Role, UserRole
from app.core.security import get_password_hash, hash_token, generate_verification_token
from app.core.exceptions import NotFoundError, ConflictError, PermissionDeniedError
from app.schemas.user import UserUpdate, InviteUserRequest, CreateRoleRequest, UpdateRoleRequest
from app.services.audit_service import AuditService
import structlog

log = structlog.get_logger()

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.org_repo = OrganizationRepository(db)
        self.audit = AuditService(db)
    
    async def get_users(self, org_id: uuid.UUID, page: int, per_page: int,
                        search: Optional[str] = None, is_active: Optional[bool] = None):
        users, total = await self.user_repo.get_all(org_id, page, per_page, search, is_active)
        pages = (total + per_page - 1) // per_page
        return users, total, pages
    
    async def get_user(self, user_id: uuid.UUID, org_id: uuid.UUID) -> User:
        user = await self.user_repo.get_by_id(user_id, org_id)
        if not user:
            raise NotFoundError("User not found")
        return user
    
    async def update_user(self, user_id: uuid.UUID, org_id: uuid.UUID, data: UserUpdate, updated_by: uuid.UUID) -> User:
        user = await self.get_user(user_id, org_id)
        update_dict = data.model_dump(exclude_none=True)
        old_values = {k: getattr(user, k) for k in update_dict}
        updated = await self.user_repo.update(user, update_dict)
        await self.audit.log(
            action="user.updated",
            resource_type="user", resource_id=user_id,
            user_id=updated_by, organization_id=org_id,
            old_values=old_values, new_values=update_dict
        )
        await self.db.commit()
        return await self.user_repo.get_user_with_roles(user_id)
    
    async def invite_user(self, org_id: uuid.UUID, req: InviteUserRequest, invited_by: uuid.UUID) -> dict:
        # Check if email already registered in this org
        existing = await self.user_repo.get_by_email(req.email)
        if existing and existing.organization_id == org_id:
            raise ConflictError("User with this email already exists in the organization")
        
        # Check role exists
        role_result = await self.db.execute(
            select(Role).where(Role.id == req.role_id)
        )
        role = role_result.scalar_one_or_none()
        if not role:
            raise NotFoundError("Role not found")
        
        raw_token = generate_verification_token()
        token_hash = hash_token(raw_token)
        expires = datetime.now(timezone.utc) + timedelta(days=7)
        
        await self.user_repo.create_invitation({
            "organization_id": org_id,
            "email": req.email.lower(),
            "role_id": req.role_id,
            "token_hash": token_hash,
            "expires_at": expires,
            "invited_by_id": invited_by,
            "is_active": True,
        })
        
        await self.audit.log(
            action="user.invited",
            resource_type="invitation",
            user_id=invited_by, organization_id=org_id,
            new_values={"email": req.email, "role_id": str(req.role_id)}
        )
        
        try:
            from app.workers.notification_tasks import send_invitation_email_task
            send_invitation_email_task.delay(str(org_id), req.email, raw_token)
        except Exception as e:
            log.warning("failed_to_queue_invite_email", error=str(e))
        
        await self.db.commit()
        return {"message": f"Invitation sent to {req.email}"}
    
    async def activate_user(self, user_id: uuid.UUID, org_id: uuid.UUID, activated_by: uuid.UUID) -> User:
        user = await self.get_user(user_id, org_id)
        await self.user_repo.update(user, {"is_active": True})
        await self.audit.log(action="user.activated", resource_type="user", resource_id=user_id, user_id=activated_by, organization_id=org_id)
        await self.db.commit()
        return await self.user_repo.get_user_with_roles(user_id)
    
    async def deactivate_user(self, user_id: uuid.UUID, org_id: uuid.UUID, deactivated_by: uuid.UUID) -> User:
        if user_id == deactivated_by:
            raise PermissionDeniedError("You cannot deactivate your own account")
        user = await self.get_user(user_id, org_id)
        await self.user_repo.update(user, {"is_active": False})
        # Revoke all refresh tokens
        await self.user_repo.revoke_all_user_refresh_tokens(user_id)
        await self.audit.log(action="user.deactivated", resource_type="user", resource_id=user_id, user_id=deactivated_by, organization_id=org_id)
        await self.db.commit()
        return await self.user_repo.get_user_with_roles(user_id)
    
    async def assign_role(self, user_id: uuid.UUID, role_id: uuid.UUID, org_id: uuid.UUID, assigned_by: uuid.UUID):
        await self.get_user(user_id, org_id)  # Verify user in org
        await self.user_repo.assign_role(user_id, role_id, org_id)
        await self.audit.log(action="user.role_assigned", resource_type="user", resource_id=user_id, user_id=assigned_by, organization_id=org_id, new_values={"role_id": str(role_id)})
        await self.db.commit()
    
    async def remove_role(self, user_id: uuid.UUID, role_id: uuid.UUID, org_id: uuid.UUID, removed_by: uuid.UUID):
        await self.get_user(user_id, org_id)  # Verify user in org
        await self.user_repo.remove_role(user_id, role_id)
        await self.audit.log(action="user.role_removed", resource_type="user", resource_id=user_id, user_id=removed_by, organization_id=org_id, new_values={"role_id": str(role_id)})
        await self.db.commit()
    
    async def get_roles(self, org_id: uuid.UUID) -> list[Role]:
        """Get system roles + org custom roles."""
        result = await self.db.execute(
            select(Role).where(
                (Role.organization_id == None) | (Role.organization_id == org_id)
            )
        )
        return list(result.scalars().all())
    
    async def get_all_permissions(self):
        from app.models.user import Permission
        result = await self.db.execute(select(Permission))
        return list(result.scalars().all())
    
    async def create_role(self, org_id: uuid.UUID, req: CreateRoleRequest, created_by: uuid.UUID) -> Role:
        role = Role(name=req.name, description=req.description, organization_id=org_id, is_system=False)
        self.db.add(role)
        await self.db.flush()
        
        from app.models.user import RolePermission, Permission
        for perm_id in req.permission_ids:
            perm_result = await self.db.execute(select(Permission).where(Permission.id == perm_id))
            if perm_result.scalar_one_or_none():
                rp = RolePermission(role_id=role.id, permission_id=perm_id)
                self.db.add(rp)
        
        await self.db.commit()
        return await self.db.get(Role, role.id)
