from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import Optional
import json

class Settings(BaseSettings):
    # App
    app_name: str = "CLM Platform"
    environment: str = "development"
    debug: bool = False
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # Database
    database_url: str
    database_url_sync: str
    
    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # OpenAI (Defaulting to Gemini free tier)
    openai_api_key: str = ""
    openai_base_url: Optional[str] = "https://generativelanguage.googleapis.com/v1beta/openai/"
    openai_model: str = "gemini-1.5-flash"
    openai_embedding_model: str = "text-embedding-004"
    
    # Storage
    storage_provider: str = "minio"
    storage_endpoint: str = "http://localhost:9000"
    storage_access_key: str = "minioadmin"
    storage_secret_key: str = "minioadmin123"
    storage_bucket: str = "clm-documents"
    storage_region: str = "us-east-1"
    
    # Email (Defaulting to Brevo free tier)
    email_provider: str = "smtp"
    smtp_host: str = "smtp-relay.brevo.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_tls: bool = True
    from_email: str = "noreply@clm.app"
    from_name: str = "CLM Platform"

    # Stripe
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()
