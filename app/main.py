import logging

from fastapi import FastAPI

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.log_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)
logger.info("App started")
logger.info(f"ENV = {settings.APP_ENV}")

app = FastAPI(title="fastapi-postgres-template")


@app.get("/health")
async def health():
    return {"health": "ok"}


app.include_router(api_router, prefix="/api/v1")
