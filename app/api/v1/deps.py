"""
Dependencies in this file assemble request-scoped objects.

get_token:
Extracts the raw JWT string from the Authorization header (Bearer <token>).
Returns None if the header is missing or malformed.

get_current_user:
Uses get_token to obtain the JWT.
Decodes the token to read the subject (user id).
Queries the database for that user.
Returns the User object if found, otherwise None.

Relationship:
Routes depend on get_current_user to obtain the authenticated user.
Routes decide how to respond if the returned user is None (e.g., return 401).
These dependencies do not raise HTTP errors or enforce business rules.


HTTP request to the server by the client -> deps run -> result into a route func -> executes the route logic

At every step of client request we need these functions to setup and send the returned values to route functions as arguments

Those dependencies run at the start of every relevant request to prepare the database connection, authenticated user, and permission context before your route logic executes.

"""

from typing import Optional
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User


def get_db(): # opens a sqlalchemy session
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()

# extract the raw JWT, returns none if missing
def get_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization") # get raw JWT
    if not auth:
        return None
    parts = auth.split()
    if len(parts) != 2:
        return None
    scheme, token = parts
    if scheme.lower() != "bearer" or not token:
        return None
    return token

# uses get_token to obtain the JWT
def get_current_user(
    token: Optional[str] = Depends(get_token),
    db: Session = Depends(SessionLocal),
) -> Optional[User]:
    if token is None:
        return None
    try:
        payload = decode_access_token(token)
    except Exception:
        return None
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        return None
    return db.query(User).filter(User.id == user_id).first()


#def get_team_by_id(): # reads the team ID from the URL path and queries the teams table

#def get_current_membership(): # queries the team_memberships table using the current user and team

#def require_permission(): # checks the role-permission map in memory



