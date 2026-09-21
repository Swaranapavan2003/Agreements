from fastapi import APIRouter, Depends, Response, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_request_metadata
from app.core.exceptions import AuthenticationError
from app.schemas.auth import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    VerifyEmailRequest, ChangePasswordRequest, AcceptInvitationRequest, TokenResponse, RefreshResponse
)
from app.schemas.user import UserResponse
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "clm_refresh_token"
COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days

@router.post("/register", response_model=APIResponse[dict])
async def register(
    req: RegisterRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    metadata: dict = Depends(get_request_metadata)
):
    svc = AuthService(db)
    user, org = await svc.register(req, metadata)
    return {"success": True, "data": {"message": "Registration successful. Please verify your email.", "user_id": str(user.id)}, "message": "Check your email to verify your account."}

@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    req: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    metadata: dict = Depends(get_request_metadata)
):
    svc = AuthService(db)
    result = await svc.login(req, metadata)
    user_resp = UserResponse.model_validate(result["user"])
    user_resp.roles = []
    from app.schemas.user import RoleResponse
    for ur in result["user"].user_roles:
        user_resp.roles.append(RoleResponse.from_orm_role(ur.role))
    
    response.set_cookie(
        key=COOKIE_NAME,
        value=result["raw_refresh_token"],
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=False,  # Set True in production
        samesite="lax",
        path="/api/v1/auth"
    )
    return {"success": True, "data": {"access_token": result["access_token"], "token_type": "bearer", "user": user_resp}}

@router.post("/refresh", response_model=APIResponse[RefreshResponse])
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: Optional[str] = Cookie(None, alias=COOKIE_NAME)
):
    if not refresh_token:
        raise AuthenticationError("No refresh token", "NO_REFRESH_TOKEN")
    svc = AuthService(db)
    new_access, new_refresh = await svc.refresh(refresh_token)
    response.set_cookie(key=COOKIE_NAME, value=new_refresh, max_age=COOKIE_MAX_AGE, httponly=True, secure=False, samesite="lax", path="/api/v1/auth")
    return {"success": True, "data": {"access_token": new_access, "token_type": "bearer"}}

@router.post("/logout", response_model=APIResponse[dict])
async def logout(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    metadata: dict = Depends(get_request_metadata),
    refresh_token: Optional[str] = Cookie(None, alias=COOKIE_NAME)
):
    if refresh_token:
        svc = AuthService(db)
        await svc.logout(refresh_token, current_user.id, metadata)
    response.delete_cookie(COOKIE_NAME, path="/api/v1/auth")
    return {"success": True, "data": {"message": "Logged out successfully"}}

@router.get("/me", response_model=APIResponse[UserResponse])
async def get_me(current_user: User = Depends(get_current_user)):
    from app.schemas.user import RoleResponse
    user_resp = UserResponse.model_validate(current_user)
    user_resp.roles = [RoleResponse.from_orm_role(ur.role) for ur in current_user.user_roles]
    return {"success": True, "data": user_resp}

@router.post("/verify-email", response_model=APIResponse[dict])
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.verify_email(token)
    return {"success": True, "data": {"message": "Email verified successfully"}}

@router.post("/forgot-password", response_model=APIResponse[dict])
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.forgot_password(req.email)
    return {"success": True, "data": {"message": "If that email is registered, a reset link has been sent."}}

@router.post("/reset-password", response_model=APIResponse[dict])
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.reset_password(req.token, req.new_password)
    return {"success": True, "data": {"message": "Password reset successfully. Please sign in."}}

@router.patch("/me/password", response_model=APIResponse[dict])
async def change_password(
    req: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import verify_password, get_password_hash
    if not verify_password(req.current_password, current_user.hashed_password):
        raise AuthenticationError("Current password is incorrect", "WRONG_PASSWORD")
    current_user.hashed_password = get_password_hash(req.new_password)
    await db.commit()
    return {"success": True, "data": {"message": "Password changed successfully"}}
