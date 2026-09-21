import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.approval import ApprovalWorkflowCreate, ApprovalRequestCreate, ApprovalRecordCreate
from app.models.approval import ApprovalWorkflow, ApprovalStep, ApprovalRequest, ApprovalRecord, ApprovalStatus
from app.models.agreement import AgreementStatus
from app.repositories.approval_repository import ApprovalRepository
from app.repositories.agreement_repository import AgreementRepository
from app.core.exceptions import NotFoundError, ConflictError, CLMException

class ApprovalService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.db = db
        self.organization_id = organization_id
        self.repo = ApprovalRepository(db, organization_id)
        self.ag_repo = AgreementRepository(db, organization_id)

    async def create_workflow(self, data: ApprovalWorkflowCreate) -> ApprovalWorkflow:
        wf = ApprovalWorkflow(
            organization_id=self.organization_id,
            name=data.name,
            description=data.description,
            is_active=data.is_active
        )
        return await self.repo.create_workflow(wf)

    async def start_approval(self, agreement_id: uuid.UUID, workflow_id: uuid.UUID) -> ApprovalRequest:
        agreement = await self.ag_repo.get_by_id_tenant(self.ag_repo.tenant_filter(self.ag_repo.__class__.__annotations__.get('model', None)) if False else __import__('app.models.agreement').models.agreement.Agreement, agreement_id)
        # using the direct model reference
        from app.models.agreement import Agreement
        agreement = await self.ag_repo.get_by_id_tenant(Agreement, agreement_id)

        req = ApprovalRequest(
            organization_id=self.organization_id,
            agreement_id=agreement_id,
            workflow_id=workflow_id,
            current_step_order=1,
            status=ApprovalStatus.PENDING
        )
        req = await self.repo.create_request(req)
        
        agreement.status = AgreementStatus.IN_REVIEW
        await self.db.flush()
        return req

    async def submit_approval(self, request_id: uuid.UUID, user_id: uuid.UUID, status: ApprovalStatus, comments: str = None) -> ApprovalRecord:
        req = await self.repo.get_request(request_id)
        if req.status != ApprovalStatus.PENDING:
            raise ConflictError("Request is already processed")
        
        steps = await self.repo.get_steps(req.workflow_id)
        current_step = next((s for s in steps if s.step_order == req.current_step_order), None)
        if not current_step:
            raise NotFoundError("Step not found")
        
        record = ApprovalRecord(
            request_id=req.id,
            step_id=current_step.id,
            user_id=user_id,
            status=status,
            comments=comments
        )
        record = await self.repo.create_record(record)
        
        if status == ApprovalStatus.REJECTED:
            req.status = ApprovalStatus.REJECTED
            from app.models.agreement import Agreement
            agreement = await self.ag_repo.get_by_id_tenant(Agreement, req.agreement_id)
            agreement.status = AgreementStatus.DRAFT
        else:
            # Check if all parallel approvals are done, simplified for now
            # Move to next step
            max_step = max((s.step_order for s in steps), default=0)
            if req.current_step_order >= max_step:
                req.status = ApprovalStatus.APPROVED
                from app.models.agreement import Agreement
                agreement = await self.ag_repo.get_by_id_tenant(Agreement, req.agreement_id)
                agreement.status = AgreementStatus.APPROVED
            else:
                req.current_step_order += 1
                
        await self.db.flush()
        return record
