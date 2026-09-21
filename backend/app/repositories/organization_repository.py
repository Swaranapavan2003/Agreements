from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.organization import Organization, Department, Team
from app.models.subscription import Plan, PlanVersion, Subscription, Entitlement
from app.core.exceptions import NotFoundError
from typing import Optional
import uuid

class OrganizationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, org_id: uuid.UUID) -> Optional[Organization]:
        result = await self.db.execute(select(Organization).where(Organization.id == org_id))
        return result.scalar_one_or_none()
    
    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        result = await self.db.execute(select(Organization).where(Organization.slug == slug))
        return result.scalar_one_or_none()
    
    async def create(self, data: dict) -> Organization:
        org = Organization(**data)
        self.db.add(org)
        await self.db.flush()
        await self.db.refresh(org)
        return org
    
    async def update(self, org: Organization, data: dict) -> Organization:
        for key, value in data.items():
            if value is not None:
                setattr(org, key, value)
        await self.db.flush()
        return org
    
    async def get_departments(self, org_id: uuid.UUID, include_inactive: bool = False) -> list[Department]:
        stmt = select(Department).where(Department.organization_id == org_id, Department.is_deleted == False)
        if not include_inactive:
            stmt = stmt.where(Department.is_active == True)
        stmt = stmt.order_by(Department.name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def create_department(self, data: dict) -> Department:
        dept = Department(**data)
        self.db.add(dept)
        await self.db.flush()
        await self.db.refresh(dept)
        return dept
    
    async def get_department_by_id(self, dept_id: uuid.UUID, org_id: uuid.UUID) -> Optional[Department]:
        result = await self.db.execute(
            select(Department).where(Department.id == dept_id, Department.organization_id == org_id, Department.is_deleted == False)
        )
        return result.scalar_one_or_none()
    
    async def update_department(self, dept: Department, data: dict) -> Department:
        for key, value in data.items():
            if value is not None:
                setattr(dept, key, value)
        await self.db.flush()
        return dept
    
    async def soft_delete_department(self, dept: Department):
        dept.is_deleted = True
        dept.is_active = False
        await self.db.flush()
    
    async def get_teams(self, org_id: uuid.UUID, department_id: Optional[uuid.UUID] = None) -> list[Team]:
        stmt = select(Team).where(Team.organization_id == org_id, Team.is_active == True)
        if department_id:
            stmt = stmt.where(Team.department_id == department_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def create_team(self, data: dict) -> Team:
        team = Team(**data)
        self.db.add(team)
        await self.db.flush()
        return team
    
    async def get_free_plan_version(self) -> Optional[PlanVersion]:
        result = await self.db.execute(
            select(PlanVersion)
            .join(Plan, Plan.id == PlanVersion.plan_id)
            .where(Plan.name == "Free", PlanVersion.is_current == True)
        )
        return result.scalar_one_or_none()
