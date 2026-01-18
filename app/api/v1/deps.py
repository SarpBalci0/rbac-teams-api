"""
Dependencies in this file assemble request-scoped objects.

Dependencies may raise HTTP errors to enforce authentication,
resource existence, and authorization correctness.
"""

from typing import Generator, Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.core.permissions import role_allows
from app.db.session import SessionLocal

from app.models.user import User
from app.models.team import Team
from app.models.membership import Membership


def get_db() -> Generator[Session, None, None]:
    """Open a SQLAlchemy session per request and close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_token(request: Request) -> Optional[str]:
    """
    Extract the raw JWT string from the Authorization header: 'Bearer <token>'.
    Returns None if missing or malformed.
    """
    auth = request.headers.get("Authorization")
    if not auth:
        return None

    parts = auth.split()
    if len(parts) != 2:
        return None

    scheme, token = parts
    if scheme.lower() != "bearer" or not token:
        return None

    return token


def get_current_user(
    token: Optional[str] = Depends(get_token),
    db: Session = Depends(get_db),
) -> User:
    """
    Return authenticated user or raise 401.
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_team_by_id(
    team_id: int,
    db: Session = Depends(get_db),
) -> Team:
    """
    Load a Team by id, or raise 404 if it doesn't exist.
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return team


def get_current_membership(
    team: Team = Depends(get_team_by_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Membership:
    """
    Return the caller's membership for the given team,
    or raise 403 if the user is not a member.
    """
    membership = (
        db.query(Membership)
        .filter(
            Membership.team_id == team.id,
            Membership.user_id == current_user.id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this team",
        )

    return membership


def require_permission(action: str):
    """
    Dependency factory:
    Ensures the current user's team role allows the given action.
    """

    def permission_dependency(
        membership: Membership = Depends(get_current_membership),
    ) -> Membership:
        role = membership.role

        if not role_allows(role, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return membership

    return permission_dependency
