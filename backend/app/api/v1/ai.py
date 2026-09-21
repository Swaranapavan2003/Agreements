from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
import uuid
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ai_analysis_service import AIAnalysisService

router = APIRouter()

class AskRequest(BaseModel):
    agreement_id: uuid.UUID
    query: str

class SearchRequest(BaseModel):
    query: str

class ExtractRequest(BaseModel):
    text: str

class DraftRequest(BaseModel):
    prompt: str
    template_context: str | None = None

@router.post("/ask", response_model=Dict[str, str])
async def ask_question(
    request: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AIAnalysisService(db)
    answer = await service.ask_question(request.agreement_id, request.query)
    return {"answer": answer}

@router.post("/search", response_model=List[Dict[str, Any]])
async def search_documents(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AIAnalysisService(db)
    results = await service.search_tenant_documents(current_user.organization_id, request.query)
    return results

@router.get("/risk-analysis/{agreement_id}", response_model=Dict[str, Any])
async def risk_analysis(
    agreement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AIAnalysisService(db)
    try:
        analysis = await service.analyze_risk(agreement_id)
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/extract", response_model=Dict[str, Any])
async def extract_metadata(
    request: ExtractRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AIAnalysisService(db)
    metadata = await service.extract_metadata(request.text)
    return metadata

@router.post("/draft", response_model=Dict[str, str])
async def draft_clause(
    request: DraftRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AIAnalysisService(db)
    draft = await service.draft_clause(request.prompt, request.template_context)
    return {"draft": draft}
