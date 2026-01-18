from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import Role
from app.models.membership import Membership
from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamMemberAdd


def create_team(db: Session, creator: User, payload: TeamCreate) -> Team:
    team = Team(name=payload.name)
    db.add(team)
    db.flush()  # ensures team.id is available

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


def add_member(db: Session, team_id: int, payload: TeamMemberAdd) -> Membership | None:
    # Find user by email
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        return None  # router converts to 404 ("User not found")

    # Create membership
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
        raise ValueError("already_member")  # router converts to 409

    db.refresh(membership)
    return membership


def list_members(db: Session, team_id: int) -> list[Membership]:
    """
    Pattern B: team existence + permissions are enforced in deps/router.
    This service just returns the memberships for the team (possibly empty).
    """
    return (
        db.query(Membership)
        .filter(Membership.team_id == team_id)
        .order_by(Membership.joined_at.asc())
        .all()
    )
