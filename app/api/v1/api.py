# Aggregates and mounts all v1 routers.

from fastapi import APIRouter

from app.api.v1.routes.teams import router as teams_router
from app.api.v1.routes.auth import router as auth_router  

api_router = APIRouter()

api_router.include_router(auth_router) 
api_router.include_router(teams_router)
