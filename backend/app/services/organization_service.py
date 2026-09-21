from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.repositories.organization_repository import OrganizationRepository
from app.models.organization import Organization, Department, Team
from app.core.exceptions import NotFoundError
from app.schemas.organization import OrganizationUpdate, DepartmentCreate, DepartmentUpdate, TeamCreate, OrganizationSettingsUpdate
from app.services.audit_service import AuditService

class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.org_repo = OrganizationRepository(db)
        self.audit = AuditService(db)
    
    async def get_organization(self, org_id: uuid.UUID) -> Organization:
        org = await self.org_repo.get_by_id(org_id)
        if not org:
            raise NotFoundError("Organization not found")
        return org
    
    async def update_organization(self, org_id: uuid.UUID, data: OrganizationUpdate, updated_by: uuid.UUID) -> Organization:
        org = await self.get_organization(org_id)
        update_dict = data.model_dump(exclude_none=True)
        if "address" in update_dict and update_dict["address"]:
            update_dict["address"] = update_dict["address"] if isinstance(update_dict["address"], dict) else update_dict["address"].model_dump()
        updated = await self.org_repo.update(org, update_dict)
        await self.audit.log(action="organization.updated", resource_type="organization", resource_id=org_id, user_id=updated_by, organization_id=org_id, new_values=update_dict)
        await self.db.commit()
        return updated
    
    async def get_departments(self, org_id: uuid.UUID, include_inactive: bool = False) -> list[Department]:
        return await self.org_repo.get_departments(org_id, include_inactive)
    
    async def create_department(self, org_id: uuid.UUID, data: DepartmentCreate, created_by: uuid.UUID) -> Department:
        dept = await self.org_repo.create_department({
            "organization_id": org_id,
            "name": data.name,
            "description": data.description,
            "parent_id": data.parent_id,
            "head_user_id": data.head_user_id,
            "is_active": True,
        })
        await self.audit.log(action="department.created", resource_type="department", resource_id=dept.id, user_id=created_by, organization_id=org_id)
        await self.db.commit()
        return dept
    
    async def update_department(self, dept_id: uuid.UUID, org_id: uuid.UUID, data: DepartmentUpdate, updated_by: uuid.UUID) -> Department:
        dept = await self.org_repo.get_department_by_id(dept_id, org_id)
        if not dept:
            raise NotFoundError("Department not found")
        update_dict = data.model_dump(exclude_none=True)
        updated = await self.org_repo.update_department(dept, update_dict)
        await self.audit.log(action="department.updated", resource_type="department", resource_id=dept_id, user_id=updated_by, organization_id=org_id)
        await self.db.commit()
        return updated
    
    async def delete_department(self, dept_id: uuid.UUID, org_id: uuid.UUID, deleted_by: uuid.UUID):
        dept = await self.org_repo.get_department_by_id(dept_id, org_id)
        if not dept:
            raise NotFoundError("Department not found")
        await self.org_repo.soft_delete_department(dept)
        await self.audit.log(action="department.deleted", resource_type="department", resource_id=dept_id, user_id=deleted_by, organization_id=org_id)
        await self.db.commit()
    
    async def get_settings(self, org_id: uuid.UUID) -> dict:
        org = await self.get_organization(org_id)
        return org.settings or {}
    
    async def update_settings(self, org_id: uuid.UUID, data: OrganizationSettingsUpdate, updated_by: uuid.UUID) -> dict:
        org = await self.get_organization(org_id)
        updates = data.model_dump(exclude_none=True)
        new_settings = {**(org.settings or {}), **updates}
        org.settings = new_settings
        await self.db.flush()
        await self.audit.log(action="settings.updated", resource_type="organization", resource_id=org_id, user_id=updated_by, organization_id=org_id, new_values=updates)
        await self.db.commit()
        return new_settings
    
    async def get_teams(self, org_id: uuid.UUID, department_id: Optional[uuid.UUID] = None) -> list[Team]:
        return await self.org_repo.get_teams(org_id, department_id)
    
    async def create_team(self, org_id: uuid.UUID, data: TeamCreate, created_by: uuid.UUID) -> Team:
        team = await self.org_repo.create_team({"organization_id": org_id, "name": data.name, "description": data.description, "department_id": data.department_id, "is_active": True})
        await self.db.commit()
        return team
