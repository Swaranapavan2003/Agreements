from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.schemas.common import APIResponse, PaginatedData
from app.services.notification_service import NotificationService
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=APIResponse[PaginatedData[NotificationResponse]])
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = NotificationService(db)
    items, total = await svc.get_user_notifications(current_user.id, current_user.organization_id, page, per_page, unread_only)
    pages = (total + per_page - 1) // per_page
    return {"success": True, "data": {"items": [NotificationResponse.model_validate(n) for n in items], "total": total, "page": page, "per_page": per_page, "pages": pages}}

@router.get("/unread-count", response_model=APIResponse[UnreadCountResponse])
async def get_unread_count(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = NotificationService(db)
    count = await svc.get_unread_count(current_user.id, current_user.organization_id)
    return {"success": True, "data": {"count": count}}

@router.patch("/{notification_id}/read", response_model=APIResponse[dict])
async def mark_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    svc = NotificationService(db)
    await svc.mark_read(notification_id, current_user.id, current_user.organization_id)
    return {"success": True, "data": {"message": "Notification marked as read"}}

@router.post("/read-all", response_model=APIResponse[dict])
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    svc = NotificationService(db)
    await svc.mark_all_read(current_user.id, current_user.organization_id)
    return {"success": True, "data": {"message": "All notifications marked as read"}}
