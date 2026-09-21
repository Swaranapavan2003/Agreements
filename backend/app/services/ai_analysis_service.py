import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.ai import DocumentChunk
from app.models.agreement import AgreementVersion
from app.core.config import settings
from openai import AsyncOpenAI
import logging
import json

logger = logging.getLogger(__name__)

class AIAnalysisService:
    def __init__(self, db: AsyncSession):
        self.db = db
        kwargs = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        self.openai_client = AsyncOpenAI(**kwargs)

    async def _get_embedding(self, text: str) -> List[float]:
        try:
            response = await self.openai_client.embeddings.create(
                input=text,
                model=settings.openai_embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            return [0.0] * 1536

    async def ask_question(self, agreement_id: uuid.UUID, query: str) -> str:
        query_embedding = await self._get_embedding(query)
        
        # Search chunks
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.agreement_id == agreement_id)
            .order_by(DocumentChunk.embedding.l2_distance(query_embedding))
            .limit(5)
        )
        result = await self.db.execute(stmt)
        chunks = result.scalars().all()
        
        context = "\n\n".join([chunk.chunk_text for chunk in chunks])
        
        prompt = f"Context from document:\n{context}\n\nQuestion: {query}\n\nAnswer based on the context."
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Error asking question: {e}")
            return "Failed to generate answer."

    async def search_tenant_documents(self, organization_id: uuid.UUID, query: str) -> List[Dict[str, Any]]:
        query_embedding = await self._get_embedding(query)
        
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.organization_id == organization_id)
            .order_by(DocumentChunk.embedding.l2_distance(query_embedding))
            .limit(10)
        )
        result = await self.db.execute(stmt)
        chunks = result.scalars().all()
        
        return [
            {
                "agreement_id": str(chunk.agreement_id),
                "version_id": str(chunk.version_id),
                "text": chunk.chunk_text,
                "page_number": chunk.page_number
            }
            for chunk in chunks
        ]

    async def analyze_risk(self, agreement_id: uuid.UUID) -> Dict[str, Any]:
        # Fetch latest version text
        stmt = (
            select(AgreementVersion)
            .where(AgreementVersion.agreement_id == agreement_id)
            .order_by(desc(AgreementVersion.version_number))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        version = result.scalar_one_or_none()
        if not version:
            raise ValueError(f"No version found for agreement {agreement_id}")
            
        # We need the chunks
        stmt_chunks = select(DocumentChunk).where(DocumentChunk.version_id == version.id)
        result_chunks = await self.db.execute(stmt_chunks)
        chunks = result_chunks.scalars().all()
        text = "\n".join([chunk.chunk_text for chunk in chunks])

        schema = {
            "type": "object",
            "properties": {
                "risk_level": {"type": "string", "enum": ["Low", "Med", "High"]},
                "summary": {"type": "string"},
                "critical_clauses": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["risk_level", "summary", "critical_clauses"]
        }
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You are a legal AI risk analyzer."},
                    {"role": "user", "content": f"Analyze the following agreement text:\n\n{text[:10000]}"}
                ],
                functions=[{"name": "return_risk_analysis", "parameters": schema}],
                function_call={"name": "return_risk_analysis"}
            )
            function_args = response.choices[0].message.function_call.arguments
            return json.loads(function_args)
        except Exception as e:
            logger.error(f"Error analyzing risk: {e}")
            return {"risk_level": "Med", "summary": "Error analyzing risk.", "critical_clauses": []}

    async def extract_metadata(self, text: str) -> Dict[str, Any]:
        schema = {
            "type": "object",
            "properties": {
                "Title": {"type": "string"},
                "Effective Date": {"type": "string"},
                "Expiry Date": {"type": "string"},
                "Parties": {"type": "array", "items": {"type": "string"}},
                "Value": {"type": "string"},
                "Jurisdiction": {"type": "string"}
            },
            "required": ["Title", "Effective Date", "Expiry Date", "Parties", "Value", "Jurisdiction"]
        }
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "Extract metadata from the agreement text."},
                    {"role": "user", "content": text[:10000]}
                ],
                functions=[{"name": "return_metadata", "parameters": schema}],
                function_call={"name": "return_metadata"}
            )
            function_args = response.choices[0].message.function_call.arguments
            return json.loads(function_args)
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
            return {}

    async def draft_clause(self, prompt: str, template_context: Optional[str] = None) -> str:
        system_prompt = "You are an expert legal drafter."
        if template_context:
            system_prompt += f" Context: {template_context}"
            
        try:
            response = await self.openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Error drafting clause: {e}")
            return "Failed to draft clause."
