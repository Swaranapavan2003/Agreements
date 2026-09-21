from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.startup import startup_event
from app.api import api_router

log = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup", environment=settings.environment)
    await startup_event()
    yield
    log.info("shutdown")

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-Powered Agreement Lifecycle Management Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# Routes
app.include_router(api_router, prefix="/api/v1")

import redis.asyncio as aioredis
from sqlalchemy import text
from app.core.database import engine

@app.get("/health")
async def health_check():
    health_status = {"status": "ok", "db": "ok", "redis": "ok", "version": "1.0.0", "environment": settings.environment}
    
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        log.error("healthcheck_db_error", error=str(e))
        health_status["db"] = "error"
        health_status["status"] = "error"
        
    try:
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
    except Exception as e:
        log.error("healthcheck_redis_error", error=str(e))
        health_status["redis"] = "error"
        health_status["status"] = "error"

    return health_status

@app.get("/")
async def root():
    return {"message": f"{settings.app_name} API", "docs": "/docs"}
