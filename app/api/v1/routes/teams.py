#  HTTP endpoints for creating teams, getting a team, listing members, and adding members (RBAC via dependencies).

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import (
    get_current_user,
    get_db,
    get_team_by_id,
    require_permission,
)
from app.core.permissions import TEAM_READ, TEAM_MEMBER_ADD, TEAM_MEMBER_LIST
from app.models.membership import Membership
from app.models.team import Team
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
    current_user: User = Depends(get_current_user),
):
    team = team_service.create_team(db=db, creator=current_user, payload=payload)
    return team


@router.get("/{team_id}", response_model=TeamPublic)
def get_team(
    team: Team = Depends(get_team_by_id),
    _: Membership = Depends(require_permission(TEAM_READ)),
):
    return team


@router.get("/{team_id}/members", response_model=list[TeamMemberPublic])
def list_members(
    team_id: int,
    db: Session = Depends(get_db),
    _: Membership = Depends(require_permission(TEAM_MEMBER_LIST)),
):
    members = team_service.list_members(db=db, team_id=team_id)
    return members


@router.post(
    "/{team_id}/members",
    response_model=TeamMemberPublic,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    team_id: int,
    payload: TeamMemberAdd,
    db: Session = Depends(get_db),
    _: Membership = Depends(require_permission(TEAM_MEMBER_ADD)),
):
    try:
        membership = team_service.add_member(db=db, team_id=team_id, payload=payload)
    except ValueError as e:
        if str(e) == "already_member":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member",
            )
        raise

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return membership
