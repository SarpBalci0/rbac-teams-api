# Password hashing/verification and JWT creation/decoding utilities.

import bcrypt 
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings


def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8") 
    salt = bcrypt.gensalt() 
    hashed_password = bcrypt.hashpw(password_bytes, salt)
    return hashed_password


def verify_password(password: str, hashed_password: bytes) -> bool:
    password_bytes = password.encode("utf-8")
    stored_hash = hashed_password 
    is_valid = bcrypt.checkpw(password_bytes, stored_hash)
    return is_valid


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    # payload is the decoded data section of the token that contains claims like user ID, email, expiration.
    payload = {"sub": subject, "exp": expire} 
    access_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return access_token


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return payload