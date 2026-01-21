# HTTP endpoints for register and login, mapping service outcomes to HTTP responses.

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db
from app.schemas.auth import Login, Register, TokenResponse, UserPublic
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: Register, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db=db, payload=payload)
    except ValueError as e:
        if str(e) == "email_taken":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: Login, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db=db, payload=payload)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = auth_service.issue_access_token(user)
    return TokenResponse(access_token=token)