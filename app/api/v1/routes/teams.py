"""
routes --> HTTP handlers that:
    1 - declare the endpoint path and method
    2 - accept validated schema inputs
    3 - call the appropriate service-layer function
    4 - return schema-formatted responses

    Your router should not directly talk to SQLAlchemy models.
    Instead, it should call functions in app/services/teams.py.

    HTTP Request
        ↓
    Router function (teams.py)
        ↓ calls →
    Service function (services/teams.py)
        ↓ uses →
    SQLAlchemy models (Team, Membership, User)
        ↓ returns →
    Data object
        ↓
    Router returns response_model schema

    
    The router gets its return values by calling service-layer 
    functions that perform database operations and return ORM objects, 
    which the router then returns as schema-formatted responses.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamPublic,
    TeamMemberAdd,
    TeamMemberPublic,
)
from app.services import team_service as team_service

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamPublic, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    team = team_service.create_team(db=db, creator=current_user, payload=payload)
    return team


@router.get("/{team_id}", response_model=TeamPublic)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    team = team_service.get_team(db=db, team_id=team_id)
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


@router.post("/{team_id}/members", response_model=TeamMemberPublic, status_code=status.HTTP_201_CREATED)
def add_member(
    team_id: int,
    payload: TeamMemberAdd,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        membership = team_service.add_member(db=db, team_id=team_id, payload=payload)
    except ValueError as e:
        if str(e) == "already_member":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member")
        raise

    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team or user not found")

    return membership


@router.get("/{team_id}/members", response_model=list[TeamMemberPublic])
def list_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    members = team_service.list_members(db=db, team_id=team_id)
    if members is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return members