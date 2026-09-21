from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from typing import AsyncGenerator

db_url = settings.database_url.replace("?sslmode=require", "?ssl=require")

engine = create_async_engine(
    db_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initialize database — create pgvector extension."""
    async with engine.begin() as conn:
        await conn.execute(
            __import__('sqlalchemy').text("CREATE EXTENSION IF NOT EXISTS vector")
        )
        await conn.execute(
            __import__('sqlalchemy').text("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        )
