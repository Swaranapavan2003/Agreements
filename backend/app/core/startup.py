import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.models.user import Permission, Role, RolePermission
from app.models.subscription import Plan, PlanVersion
from datetime import datetime, timezone
from decimal import Decimal
import uuid

log = structlog.get_logger()

DEFAULT_PERMISSIONS = [
    ("agreement.read", "Read agreements", "agreement"),
    ("agreement.create", "Create agreements", "agreement"),
    ("agreement.update", "Update agreements", "agreement"),
    ("agreement.delete", "Delete agreements", "agreement"),
    ("agreement.approve", "Approve agreements", "agreement"),
    ("agreement.sign", "Sign agreements", "agreement"),
    ("agreement.download", "Download agreements", "agreement"),
    ("template.manage", "Manage templates", "template"),
    ("clause.manage", "Manage clauses", "clause"),
    ("user.manage", "Manage users", "user"),
    ("audit.read", "Read audit logs", "audit"),
]

DEFAULT_ROLES = {
    "Organization Admin": ["agreement.read", "agreement.create", "agreement.update", "agreement.delete", "agreement.approve", "agreement.sign", "agreement.download", "template.manage", "clause.manage", "user.manage", "audit.read"],
    "Agreement Manager": ["agreement.read", "agreement.create", "agreement.update", "agreement.delete", "agreement.download", "template.manage", "clause.manage"],
    "Reviewer": ["agreement.read", "agreement.update"],
    "Approver": ["agreement.read", "agreement.approve"],
    "Signatory": ["agreement.read", "agreement.sign"],
    "Viewer": ["agreement.read"],
}

DEFAULT_PLANS = [
    {
        "name": "Free",
        "features": {"max_users": 3, "max_agreements": 10, "max_templates": 5, "ai_features": False, "esignature": False, "advanced_workflows": False, "api_access": False, "custom_roles": False, "reporting": False},
        "limits": {"max_storage_gb": 1, "max_ai_requests_per_month": 0, "max_signature_requests_per_month": 0},
        "price_inr": Decimal("0.00"),
    },
    {
        "name": "Basic",
        "features": {"max_users": 10, "max_agreements": 100, "max_templates": 20, "ai_features": True, "esignature": True, "advanced_workflows": False, "api_access": False, "custom_roles": True, "reporting": True},
        "limits": {"max_storage_gb": 10, "max_ai_requests_per_month": 500, "max_signature_requests_per_month": 100},
        "price_inr": Decimal("2999.00"),
    },
    {
        "name": "Pro",
        "features": {"max_users": 50, "max_agreements": -1, "max_templates": -1, "ai_features": True, "esignature": True, "advanced_workflows": True, "api_access": True, "custom_roles": True, "reporting": True},
        "limits": {"max_storage_gb": 100, "max_ai_requests_per_month": 2000, "max_signature_requests_per_month": 500},
        "price_inr": Decimal("9999.00"),
    },
    {
        "name": "Enterprise",
        "features": {"max_users": -1, "max_agreements": -1, "max_templates": -1, "ai_features": True, "esignature": True, "advanced_workflows": True, "api_access": True, "custom_roles": True, "reporting": True},
        "limits": {"max_storage_gb": -1, "max_ai_requests_per_month": -1, "max_signature_requests_per_month": -1},
        "price_inr": Decimal("0.00"),
    },
]

async def seed_initial_data(db: AsyncSession):
    # Seed permissions
    perm_map = {}
    for pname, pdesc, pcat in DEFAULT_PERMISSIONS:
        result = await db.execute(select(Permission).where(Permission.name == pname))
        perm = result.scalar_one_or_none()
        if not perm:
            perm = Permission(name=pname, description=pdesc, category=pcat)
            db.add(perm)
            await db.flush()
        perm_map[pname] = perm
    
    # Seed roles
    for role_name, role_perms in DEFAULT_ROLES.items():
        result = await db.execute(select(Role).where(Role.name == role_name, Role.organization_id == None))
        role = result.scalar_one_or_none()
        if not role:
            role = Role(name=role_name, is_system=True, organization_id=None)
            db.add(role)
            await db.flush()
            for pname in role_perms:
                if pname in perm_map:
                    rp = RolePermission(role_id=role.id, permission_id=perm_map[pname].id)
                    db.add(rp)
    
    # Seed plans
    for plan_data in DEFAULT_PLANS:
        result = await db.execute(select(Plan).where(Plan.name == plan_data["name"]))
        plan = result.scalar_one_or_none()
        if not plan:
            plan = Plan(name=plan_data["name"], is_active=True)
            db.add(plan)
            await db.flush()
            pv = PlanVersion(
                plan_id=plan.id,
                version=1,
                features=plan_data["features"],
                limits=plan_data["limits"],
                price_inr=plan_data["price_inr"],
                is_current=True,
                valid_from=datetime.now(timezone.utc),
            )
            db.add(pv)
    
    await db.commit()
    log.info("seed_complete", roles=len(DEFAULT_ROLES), plans=len(DEFAULT_PLANS))

async def startup_event():
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)
    log.info("startup_complete")
