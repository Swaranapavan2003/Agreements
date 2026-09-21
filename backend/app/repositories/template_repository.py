from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple
import uuid

from app.repositories.base import TenantRepository
from app.models.template import Template, TemplateField
from app.schemas.template import TemplateCreate, TemplateUpdate

class TemplateRepository(TenantRepository):
    async def get_by_id(self, template_id: uuid.UUID) -> Template:
        stmt = (
            select(Template)
            .options(selectinload(Template.fields))
            .where(
                Template.id == template_id,
                self.tenant_filter(Template),
                Template.is_deleted == False
            )
        )
        result = await self.db.execute(stmt)
        obj = result.scalar_one_or_none()
        if not obj:
            from app.core.exceptions import NotFoundError
            raise NotFoundError("Template not found")
        return obj

    async def list_templates(self, page: int = 1, size: int = 20) -> Tuple[List[Template], int]:
        filters = [Template.is_deleted == False]
        total = await self.count(Template, *filters)
        
        stmt = (
            select(Template)
            .options(selectinload(Template.fields))
            .where(self.tenant_filter(Template), *filters)
            .order_by(Template.created_at.desc())
        )
        stmt = self.apply_pagination(stmt, page, size)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def create(self, user_id: uuid.UUID, data: TemplateCreate) -> Template:
        template = Template(
            organization_id=self.organization_id,
            created_by_id=user_id,
            name=data.name,
            description=data.description,
            html_content=data.html_content,
            is_published=data.is_published
        )
        if data.fields:
            for field_data in data.fields:
                template.fields.append(TemplateField(
                    name=field_data.name,
                    type=field_data.type,
                    is_required=field_data.is_required
                ))
                
        self.db.add(template)
        await self.db.flush()
        return template

    async def update(self, template_id: uuid.UUID, data: TemplateUpdate) -> Template:
        template = await self.get_by_id(template_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
            
        await self.db.flush()
        return template

    async def delete(self, template_id: uuid.UUID) -> None:
        template = await self.get_by_id(template_id)
        template.is_deleted = True
        import datetime
        template.deleted_at = datetime.datetime.now(datetime.timezone.utc)
        await self.db.flush()
