from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.exceptions import NotFoundError, TenantViolationError
from typing import TypeVar, Type, Any
import uuid

ModelT = TypeVar("ModelT")

class TenantRepository:
    """Base repository that enforces tenant isolation on all queries."""
    
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.db = db
        self.organization_id = organization_id
    
    def tenant_filter(self, model: Type[ModelT]):
        """Return a WHERE clause filtering by this tenant's organization_id."""
        return model.organization_id == self.organization_id
    
    async def get_by_id_tenant(self, model: Type[ModelT], id: uuid.UUID) -> ModelT:
        """Get by ID enforcing tenant ownership. Raises NotFoundError if wrong tenant or missing."""
        result = await self.db.execute(
            select(model).where(model.id == id, self.tenant_filter(model))
        )
        obj = result.scalar_one_or_none()
        if not obj:
            raise NotFoundError(f"{model.__name__} not found")
        return obj
    
    async def count(self, model: Type[ModelT], *extra_filters) -> int:
        stmt = select(func.count()).select_from(model).where(
            self.tenant_filter(model), *extra_filters
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()
    
    @staticmethod
    def apply_pagination(stmt, page: int, per_page: int):
        offset = (page - 1) * per_page
        return stmt.offset(offset).limit(per_page)
