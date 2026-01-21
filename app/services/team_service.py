# Business logic for creating teams, adding members, and listing memberships.

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.models.membership import Membership
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamMemberAdd


def _member_payload(membership: Membership, email: str) -> dict:
    return {
        "user_id": membership.user_id,
        "email": email,
        "role": membership.role,
        "joined_at": membership.joined_at,
    }


def create_team(db: Session, creator: User, payload: TeamCreate) -> Team:
    team = Team(name=payload.name)
    db.add(team)
    db.flush() 

    membership = Membership(
        user_id=creator.id,
        team_id=team.id,
        role=Role.admin,
    )
    db.add(membership)

    db.commit()
    db.refresh(team)
    return team


def get_team(db: Session, team_id: int) -> Team | None:
    return db.query(Team).filter(Team.id == team_id).first()


def list_teams_for_user(db: Session, user: User) -> list[Team]:
    return (
        db.query(Team)
        .join(Membership, Membership.team_id == Team.id)
        .filter(Membership.user_id == user.id)
        .order_by(Team.created_at.asc())
        .all()
    )


def add_member(db: Session, team_id: int, payload: TeamMemberAdd) -> dict | None:
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        return None 

    membership = Membership(
        user_id=user.id,
        team_id=team_id,
        role=payload.role,
    )
    db.add(membership)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("already_member") 

    db.refresh(membership)
    return _member_payload(membership, user.email)


def list_members(db: Session, team_id: int) -> list[dict]:
    rows = (
        db.query(Membership, User.email)
        .join(User, User.id == Membership.user_id)
        .filter(Membership.team_id == team_id)
        .order_by(Membership.joined_at.asc())
        .all()
    )
    return [_member_payload(membership, email) for membership, email in rows]


def remove_member(db: Session, team_id: int, user_id: int) -> bool:
    membership = (
        db.query(Membership)
        .filter(
            Membership.team_id == team_id,
            Membership.user_id == user_id,
        )
        .first()
    )
    if membership is None:
        return False

    db.delete(membership)
    db.commit()
    return True


def change_member_role(
    db: Session,
    team_id: int,
    user_id: int,
    new_role: Role,
) -> dict | None:
    membership = (
        db.query(Membership)
        .filter(
            Membership.team_id == team_id,
            Membership.user_id == user_id,
        )
        .first()
    )
    if membership is None:
        return None

    membership.role = new_role
    db.commit()
    db.refresh(membership)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        return None
    return _member_payload(membership, user.email)
