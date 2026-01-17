# api.py is just the central place where you gather all v1 routers and expose them as one versioned API router

from fastapi import APIRouter

from app.api.v1.routes.teams import router as teams_router

api_router = APIRouter()
api_router.include_router(teams_router)
