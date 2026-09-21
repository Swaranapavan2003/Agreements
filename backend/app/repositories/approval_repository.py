import uuid
from typing import List, Tuple
from sqlalchemy import select
from app.repositories.base import TenantRepository
from app.models.approval import ApprovalWorkflow, ApprovalStep, ApprovalRequest, ApprovalRecord
from app.core.exceptions import NotFoundError

class ApprovalRepository(TenantRepository):
    async def create_workflow(self, workflow: ApprovalWorkflow) -> ApprovalWorkflow:
        self.db.add(workflow)
        await self.db.flush()
        return workflow
    
    async def get_workflow(self, workflow_id: uuid.UUID) -> ApprovalWorkflow:
        return await self.get_by_id_tenant(ApprovalWorkflow, workflow_id)

    async def create_step(self, step: ApprovalStep) -> ApprovalStep:
        self.db.add(step)
        await self.db.flush()
        return step
    
    async def get_steps(self, workflow_id: uuid.UUID) -> List[ApprovalStep]:
        stmt = select(ApprovalStep).where(ApprovalStep.workflow_id == workflow_id).order_by(ApprovalStep.step_order)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def create_request(self, request: ApprovalRequest) -> ApprovalRequest:
        self.db.add(request)
        await self.db.flush()
        return request

    async def get_request(self, request_id: uuid.UUID) -> ApprovalRequest:
        return await self.get_by_id_tenant(ApprovalRequest, request_id)

    async def get_request_by_agreement(self, agreement_id: uuid.UUID) -> ApprovalRequest:
        stmt = select(ApprovalRequest).where(
            ApprovalRequest.agreement_id == agreement_id,
            self.tenant_filter(ApprovalRequest)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_record(self, record: ApprovalRecord) -> ApprovalRecord:
        self.db.add(record)
        await self.db.flush()
        return record
