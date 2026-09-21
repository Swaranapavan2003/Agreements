from fastapi import APIRouter
from app.api.v1 import auth, users, organizations, roles, notifications, agreements, templates, clauses, comments, versions, approvals, signatures, lifecycle, ai, billing

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(organizations.router)
api_router.include_router(roles.router)
api_router.include_router(notifications.router)
api_router.include_router(agreements.router)
api_router.include_router(templates.router)
api_router.include_router(clauses.router)
api_router.include_router(comments.router)
api_router.include_router(versions.router)

api_router.include_router(approvals.router)
api_router.include_router(signatures.router)
api_router.include_router(lifecycle.router)
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(billing.router)
