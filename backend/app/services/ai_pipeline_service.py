import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.ai import DocumentChunk
from app.models.agreement import AgreementVersion
from app.core.config import settings
from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)

class AIPipelineService:
    def __init__(self, db: AsyncSession):
        self.db = db
        kwargs = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        self.openai_client = AsyncOpenAI(**kwargs)

    async def process_document(self, version_id: uuid.UUID):
        # Fetch the agreement version
        stmt = select(AgreementVersion).options(selectinload(AgreementVersion.agreement)).where(AgreementVersion.id == version_id)
        result = await self.db.execute(stmt)
        version = result.scalar_one_or_none()
        if not version:
            raise ValueError(f"AgreementVersion {version_id} not found")

        # Mock text extraction
        extracted_text = "This is a mock extracted text for the agreement. It contains several clauses regarding termination, liability, and confidentiality. The effective date is January 1, 2025."
        
        # Chunk text
        chunks = self._chunk_text(extracted_text)
        
        # Embed and save chunks
        for i, chunk in enumerate(chunks):
            embedding = await self._get_embedding(chunk)
            doc_chunk = DocumentChunk(
                organization_id=version.agreement.organization_id if version.agreement else uuid.uuid4(),
                agreement_id=version.agreement_id,
                version_id=version.id,
                chunk_text=chunk,
                page_number=1,
                embedding=embedding
            )
            self.db.add(doc_chunk)
            
        await self.db.commit()

    def _chunk_text(self, text: str, chunk_size: int = 500) -> List[str]:
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunks.append(" ".join(words[i:i + chunk_size]))
        return chunks

    async def _get_embedding(self, text: str) -> List[float]:
        try:
            response = await self.openai_client.embeddings.create(
                input=text,
                model=settings.openai_embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            # return mock embedding for fallback
            return [0.0] * 1536
