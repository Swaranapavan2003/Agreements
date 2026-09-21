from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, update, delete
from sqlalchemy.orm import selectinload
from app.models.user import User, Role, UserRole, RolePermission, Permission, Invitation, RefreshToken
from app.core.exceptions import NotFoundError, ConflictError
from app.core.security import hash_token
from typing import Optional
from datetime import datetime, timezone
import uuid

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Find user by email globally (email is globally unique)."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower(), User.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id(self, user_id: uuid.UUID, organization_id: uuid.UUID) -> Optional[User]:
        """Get user by ID, scoped to organization."""
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.organization_id == organization_id,
                User.is_deleted == False
            ).options(selectinload(User.user_roles).selectinload(UserRole.role).selectinload(Role.role_permissions).selectinload(RolePermission.permission))
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, organization_id: uuid.UUID, page: int = 1, per_page: int = 20,
                      search: Optional[str] = None, is_active: Optional[bool] = None) -> tuple[list[User], int]:
        stmt = select(User).where(
            User.organization_id == organization_id,
            User.is_deleted == False
        ).options(selectinload(User.user_roles).selectinload(UserRole.role).selectinload(Role.role_permissions).selectinload(RolePermission.permission))
        
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(User.first_name.ilike(pattern), User.last_name.ilike(pattern), User.email.ilike(pattern))
            )
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
        
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        
        stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
        users = (await self.db.execute(stmt)).scalars().all()
        return list(users), total
    
    async def create(self, data: dict) -> User:
        user = User(**data)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def update(self, user: User, data: dict) -> User:
        for key, value in data.items():
            if value is not None:
                setattr(user, key, value)
        await self.db.flush()
        return user
    
    async def assign_role(self, user_id: uuid.UUID, role_id: uuid.UUID, org_id: uuid.UUID) -> UserRole:
        existing = await self.db.execute(
            select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
        )
        if existing.scalar_one_or_none():
            raise ConflictError("User already has this role")
        ur = UserRole(user_id=user_id, role_id=role_id, organization_id=org_id)
        self.db.add(ur)
        await self.db.flush()
        return ur
    
    async def remove_role(self, user_id: uuid.UUID, role_id: uuid.UUID):
        await self.db.execute(
            delete(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
        )
        await self.db.flush()
    
    async def get_invitation_by_token_hash(self, token_hash: str) -> Optional[Invitation]:
        result = await self.db.execute(
            select(Invitation).where(Invitation.token_hash == token_hash, Invitation.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def create_invitation(self, data: dict) -> Invitation:
        inv = Invitation(**data)
        self.db.add(inv)
        await self.db.flush()
        return inv
    
    async def create_refresh_token(self, data: dict) -> RefreshToken:
        rt = RefreshToken(**data)
        self.db.add(rt)
        await self.db.flush()
        return rt
    
    async def get_refresh_token(self, token_hash: str) -> Optional[RefreshToken]:
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash, RefreshToken.is_revoked == False)
        )
        return result.scalar_one_or_none()
    
    async def revoke_refresh_token(self, token_hash: str):
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.token_hash == token_hash).values(is_revoked=True)
        )
        await self.db.flush()
    
    async def revoke_all_user_refresh_tokens(self, user_id: uuid.UUID):
        await self.db.execute(
            update(RefreshToken).where(RefreshToken.user_id == user_id).values(is_revoked=True)
        )
        await self.db.flush()
    
    async def get_user_with_roles(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_deleted == False)
            .options(selectinload(User.user_roles).selectinload(UserRole.role).selectinload(Role.role_permissions).selectinload(RolePermission.permission))
        )
        return result.scalar_one_or_none()
