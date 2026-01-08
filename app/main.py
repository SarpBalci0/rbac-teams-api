# app/main.py
import logging
from fastapi import FastAPI
from app.core.log_config import setup_logging
from app.core.config import settings

setup_logging()
logger = logging.getLogger(__name__)
logger.info("App started")
logger.info(f"ENV = {settings.APP_ENV}")

app = FastAPI(title="fastapi-postgres-template")

@app.get("/health")
async def root():
    return {"health": "ok"}
