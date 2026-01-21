# Boots the FastAPI app, sets logging, health endpoint, routers, and OpenAPI schema with Swagger auth.

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.log_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)
logger.info("App started")
logger.info(f"ENV = {settings.APP_ENV}")

app = FastAPI(
    title="fastapi-postgres-template",
    swagger_ui_parameters={"persistAuthorization": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="RBAC Teams API",
        routes=app.routes,
    )
    openapi_schema.setdefault("components", {}).setdefault("securitySchemes", {})[
        "bearerAuth"
    ] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health")
async def health():
    return {"health": "ok"}


app.include_router(api_router, prefix="/api/v1")
