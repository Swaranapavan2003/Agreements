import uuid
from typing import Tuple, List, Optional
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.agreement import Agreement, AgreementStatus, AgreementVersion, AgreementParty
from app.schemas.agreement import AgreementCreate, AgreementUpdate, AgreementPartyCreate
from app.repositories.agreement_repository import AgreementRepository
from app.services.agreement_state_machine import AgreementStateMachine
from app.services.storage_service import StorageService
from app.services.audit_service import AuditService

class AgreementService:
    def __init__(self, db: AsyncSession, organization_id: uuid.UUID):
        self.db = db
        self.organization_id = organization_id
        self.repo = AgreementRepository(db, organization_id)
        self.storage = StorageService()
        self.audit = AuditService(db)

    async def create_agreement(self, data: AgreementCreate, user_id: uuid.UUID) -> Agreement:
        agreement = Agreement(
            organization_id=self.organization_id,
            title=data.title,
            effective_date=data.effective_date,
            expiry_date=data.expiry_date,
            renewal_type=data.renewal_type,
            notice_period_days=data.notice_period_days,
            metadata_json=data.metadata_json,
            created_by_id=user_id
        )
        await self.repo.create_agreement(agreement)
        
        await self.audit.log(
            action="create",
            resource_type="agreement",
            resource_id=agreement.id,
            user_id=user_id,
            organization_id=self.organization_id,
            new_values={"title": data.title}
        )
        return agreement

    async def get_agreement(self, agreement_id: uuid.UUID) -> Agreement:
        return await self.repo.get_by_id_with_relations(agreement_id)

    async def list_agreements(self, page: int = 1, size: int = 50) -> Tuple[List[Agreement], int]:
        return await self.repo.list_agreements(page=page, size=size)

    async def update_agreement(self, agreement_id: uuid.UUID, data: AgreementUpdate, user_id: uuid.UUID) -> Agreement:
        agreement = await self.repo.get_by_id_with_relations(agreement_id)
        
        old_values = {}
        new_values = {}
        
        update_data = data.model_dump(exclude_unset=True)
        if 'status' in update_data:
            # Handle status explicitly in transition_state? Usually better, but we allow simple update here if they use it.
            # However, instructions said transition_state uses state machine.
            # We'll validate transition anyway if status is updated via general update.
            AgreementStateMachine.validate_transition(agreement.status, update_data['status'])
            
        for key, value in update_data.items():
            old_values[key] = getattr(agreement, key)
            setattr(agreement, key, value)
            new_values[key] = value
            
        await self.db.flush()
        
        if new_values:
            await self.audit.log(
                action="update",
                resource_type="agreement",
                resource_id=agreement.id,
                user_id=user_id,
                organization_id=self.organization_id,
                old_values=old_values,
                new_values=new_values
            )
            
        return agreement

    async def transition_state(self, agreement_id: uuid.UUID, new_status: AgreementStatus, user_id: uuid.UUID) -> Agreement:
        agreement = await self.repo.get_by_id_with_relations(agreement_id)
        
        AgreementStateMachine.validate_transition(agreement.status, new_status)
        old_status = agreement.status
        agreement.status = new_status
        await self.db.flush()
        
        await self.audit.log(
            action="transition_state",
            resource_type="agreement",
            resource_id=agreement.id,
            user_id=user_id,
            organization_id=self.organization_id,
            old_values={"status": old_status.value},
            new_values={"status": new_status.value}
        )
        return agreement

    async def add_party(self, agreement_id: uuid.UUID, data: AgreementPartyCreate, user_id: uuid.UUID) -> AgreementParty:
        # Ensure agreement exists
        await self.repo.get_by_id_with_relations(agreement_id)
        
        party = AgreementParty(
            agreement_id=agreement_id,
            name=data.name,
            entity_type=data.entity_type,
            contact_email=data.contact_email,
            signed_at=data.signed_at
        )
        await self.repo.add_party(party)
        
        await self.audit.log(
            action="add_party",
            resource_type="agreement",
            resource_id=agreement_id,
            user_id=user_id,
            organization_id=self.organization_id,
            new_values={"party_name": data.name, "entity_type": data.entity_type}
        )
        return party

    async def upload_version(self, agreement_id: uuid.UUID, file: UploadFile, change_summary: Optional[str], user_id: uuid.UUID) -> AgreementVersion:
        agreement = await self.repo.get_by_id_with_relations(agreement_id)
        
        # Calculate next version number
        next_version = len(agreement.versions) + 1
        
        # Read file
        file_content = await file.read()
        
        # Upload
        object_name = f"{self.organization_id}/agreements/{agreement_id}/v{next_version}_{file.filename}"
        await self.storage.upload_file(file_content, object_name, file.content_type or "application/octet-stream")
        
        # Create Version
        version = AgreementVersion(
            agreement_id=agreement_id,
            version_number=next_version,
            file_url=object_name, # Storing the object key as file_url
            created_by_id=user_id,
            change_summary=change_summary
        )
        await self.repo.create_version(version)
        
        await self.audit.log(
            action="upload_version",
            resource_type="agreement",
            resource_id=agreement_id,
            user_id=user_id,
            organization_id=self.organization_id,
            new_values={"version_number": next_version, "file": object_name}
        )
        
        return version
