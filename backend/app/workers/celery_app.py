from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "clm",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.notification_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.notification_tasks.*": {"queue": "notifications"},
    }
)
