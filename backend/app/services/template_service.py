import uuid
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.template_repository import TemplateRepository
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.models.template import Template

class TemplateService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.repo = TemplateRepository(db, organization_id)

    async def get_template(self, template_id: uuid.UUID) -> Template:
        return await self.repo.get_by_id(template_id)

    async def list_templates(self, page: int = 1, size: int = 20) -> Tuple[List[Template], int]:
        return await self.repo.list_templates(page, size)

    async def create_template(self, user_id: uuid.UUID, data: TemplateCreate) -> Template:
        # Additional validation can be added here
        return await self.repo.create(user_id, data)

    async def update_template(self, template_id: uuid.UUID, data: TemplateUpdate) -> Template:
        # Additional validation can be added here
        return await self.repo.update(template_id, data)

    async def delete_template(self, template_id: uuid.UUID) -> None:
        await self.repo.delete(template_id)
