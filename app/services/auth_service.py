from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import Register, Login


def register_user(db: Session, payload: Register) -> User:
    # Normalize email
    email = payload.email.strip().lower()
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise ValueError("email_taken")
    
    # Hash the password
    hashed = hash_password(payload.password)
    
    # Create User row
    user = User(
        email=email,
        hashed_password=hashed,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


def authenticate_user(db: Session, payload: Login) -> User | None:
    # Normalize email
    email = payload.email.strip().lower()
    
    # Lookup user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None  # Don't reveal which part failed
    
    if not verify_password(payload.password, user.hashed_password):
        return None
    
    return user


def issue_access_token(user: User) -> str:
    return create_access_token(subject=str(user.id))