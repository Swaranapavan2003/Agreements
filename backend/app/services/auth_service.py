from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from app.repositories.user_repository import UserRepository
from app.repositories.organization_repository import OrganizationRepository
from app.models.user import User, Role, UserRole
from app.models.organization import Organization
from app.core.security import (
    get_password_hash, verify_password, create_access_token, create_refresh_token,
    hash_token, generate_verification_token, generate_reset_token, verify_access_token
)
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshResponse
from app.schemas.user import UserResponse
from app.services.audit_service import AuditService
from app.services.entitlement_service import EntitlementService
from slugify import slugify
import structlog

log = structlog.get_logger()

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.org_repo = OrganizationRepository(db)
        self.audit = AuditService(db)
        self.entitlement_svc = EntitlementService(db)
    
    def _build_user_response(self, user: User) -> UserResponse:
        roles = []
        for ur in user.user_roles:
            from app.schemas.user import RoleResponse
            roles.append(RoleResponse.from_orm_role(ur.role))
        resp = UserResponse.model_validate(user)
        resp.roles = roles
        return resp
    
    async def register(self, req: RegisterRequest, request_metadata: dict = None) -> tuple[User, Organization]:
        # Check email uniqueness globally
        existing = await self.user_repo.get_by_email(req.email)
        if existing:
            raise ConflictError("Email is already registered", "EMAIL_EXISTS")
        
        # Create organization
        base_slug = slugify(req.organization_name)
        slug = base_slug
        counter = 1
        while await self.org_repo.get_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        org = await self.org_repo.create({
            "name": req.organization_name,
            "slug": slug,
            "email": req.email.lower(),
            "settings": {
                "agreement_number_prefix": "AGR",
                "agreement_number_format": "{prefix}-{year}-{seq:04d}",
                "default_currency": "INR",
                "timezone": "Asia/Kolkata"
            }
        })
        
        # Generate verification token
        raw_token = generate_verification_token()
        token_hash = hash_token(raw_token)
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        
        # Create user
        user = await self.user_repo.create({
            "organization_id": org.id,
            "email": req.email.lower(),
            "first_name": req.first_name,
            "last_name": req.last_name,
            "hashed_password": get_password_hash(req.password),
            "is_active": True,
            "is_verified": False,
            "verification_token": token_hash,
            "verification_token_expires": expires,
        })
        
        # Assign Organization Admin role
        admin_role = await self.db.execute(
            select(Role).where(Role.name == "Organization Admin", Role.organization_id == None)
        )
        admin_role = admin_role.scalar_one_or_none()
        if admin_role:
            await self.user_repo.assign_role(user.id, admin_role.id, org.id)
        
        # Create Free plan subscription + entitlement snapshot
        await self.entitlement_svc.create_free_subscription(org.id)
        
        # Audit log
        metadata = request_metadata or {}
        await self.audit.log(
            action="user.registered",
            resource_type="user",
            resource_id=user.id,
            user_id=user.id,
            organization_id=org.id,
            new_values={"email": user.email, "organization": org.name},
            request_metadata=metadata
        )
        
        # Queue verification email (fire and forget)
        try:
            from app.workers.notification_tasks import send_verification_email_task
            send_verification_email_task.delay(str(user.id), raw_token)
        except Exception as e:
            log.warning("failed_to_queue_verification_email", error=str(e))
        
        await self.db.commit()
        user = await self.user_repo.get_user_with_roles(user.id)
        return user, org
    
    async def login(self, req: LoginRequest, request_metadata: dict = None) -> dict:
        user = await self.user_repo.get_by_email(req.email)
        if not user or not verify_password(req.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password", "INVALID_CREDENTIALS")
        if not user.is_active:
            raise AuthenticationError("Account is deactivated. Contact your administrator.", "ACCOUNT_INACTIVE")
        if not user.is_verified:
            raise AuthenticationError("Please verify your email before signing in.", "EMAIL_NOT_VERIFIED")
        
        # Create tokens
        access_token = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
        raw_refresh = create_refresh_token()
        refresh_hash = hash_token(raw_refresh)
        
        await self.user_repo.create_refresh_token({
            "user_id": user.id,
            "token_hash": refresh_hash,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
            "ip_address": (request_metadata or {}).get("ip_address"),
            "user_agent": (request_metadata or {}).get("user_agent"),
        })
        
        # Update last_login
        await self.user_repo.update(user, {"last_login_at": datetime.now(timezone.utc)})
        
        await self.audit.log(
            action="user.login",
            resource_type="user",
            resource_id=user.id,
            user_id=user.id,
            organization_id=user.organization_id,
            request_metadata=request_metadata
        )
        
        await self.db.commit()
        user = await self.user_repo.get_user_with_roles(user.id)
        return {
            "access_token": access_token,
            "raw_refresh_token": raw_refresh,
            "user": user
        }
    
    async def refresh(self, raw_token: str) -> str:
        token_hash = hash_token(raw_token)
        rt = await self.user_repo.get_refresh_token(token_hash)
        if not rt:
            raise AuthenticationError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN")
        if rt.expires_at < datetime.now(timezone.utc):
            raise AuthenticationError("Refresh token expired", "REFRESH_TOKEN_EXPIRED")
        
        # Revoke old, issue new
        await self.user_repo.revoke_refresh_token(token_hash)
        user = await self.user_repo.get_user_with_roles(rt.user_id)
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive", "USER_INACTIVE")
        
        new_access = create_access_token({"sub": str(user.id), "org_id": str(user.organization_id)})
        new_raw_refresh = create_refresh_token()
        new_hash = hash_token(new_raw_refresh)
        
        await self.user_repo.create_refresh_token({
            "user_id": user.id,
            "token_hash": new_hash,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        })
        await self.db.commit()
        return new_access, new_raw_refresh
    
    async def logout(self, raw_token: str, user_id: uuid.UUID, request_metadata: dict = None):
        token_hash = hash_token(raw_token)
        await self.user_repo.revoke_refresh_token(token_hash)
        await self.audit.log(
            action="user.logout",
            resource_type="user",
            resource_id=user_id,
            user_id=user_id,
            request_metadata=request_metadata
        )
        await self.db.commit()
    
    async def verify_email(self, raw_token: str):
        token_hash = hash_token(raw_token)
        result = await self.db.execute(
            select(User).where(
                User.verification_token == token_hash,
                User.is_deleted == False
            )
        )
        user = result.scalar_one_or_none()
        if not user:
            raise AuthenticationError("Invalid or expired verification link", "INVALID_TOKEN")
        if user.verification_token_expires and user.verification_token_expires < datetime.now(timezone.utc):
            raise AuthenticationError("Verification link has expired", "TOKEN_EXPIRED")
        
        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        await self.audit.log(
            action="user.email_verified",
            resource_type="user",
            resource_id=user.id,
            user_id=user.id,
            organization_id=user.organization_id
        )
        await self.db.commit()
    
    async def forgot_password(self, email: str):
        user = await self.user_repo.get_by_email(email)
        if not user:
            return  # Don't reveal if email exists
        
        raw_token = generate_reset_token()
        token_hash = hash_token(raw_token)
        user.reset_password_token = token_hash
        user.reset_password_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await self.db.commit()
        
        try:
            from app.workers.notification_tasks import send_reset_password_email_task
            send_reset_password_email_task.delay(str(user.id), raw_token)
        except Exception as e:
            log.warning("failed_to_queue_reset_email", error=str(e))
    
    async def reset_password(self, raw_token: str, new_password: str):
        token_hash = hash_token(raw_token)
        result = await self.db.execute(
            select(User).where(User.reset_password_token == token_hash, User.is_deleted == False)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise AuthenticationError("Invalid or expired reset link", "INVALID_TOKEN")
        if user.reset_password_expires and user.reset_password_expires < datetime.now(timezone.utc):
            raise AuthenticationError("Reset link has expired", "TOKEN_EXPIRED")
        
        user.hashed_password = get_password_hash(new_password)
        user.reset_password_token = None
        user.reset_password_expires = None
        await self.user_repo.revoke_all_user_refresh_tokens(user.id)
        await self.audit.log(
            action="user.password_reset",
            resource_type="user",
            resource_id=user.id,
            user_id=user.id,
            organization_id=user.organization_id
        )
        await self.db.commit()
