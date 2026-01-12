import bcrypt 
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings


def hash_password(password: str) -> bytes:
    password_bytes = password.encode("utf-8") # converts plaintext string into bytes, because bcrypt requires bytes
    salt = bcrypt.gensalt() # generates a salt to make the hash unique and secure
    hashed_password = bcrypt.hashpw(password_bytes, salt) # hashes the password bytes with salt and returns the hashed password
    return hashed_password


def verify_password(password: str, hashed_password: bytes) -> bool:
    password_bytes = password.encode("utf-8")
    stored_hash = hashed_password # assigns the saved hashed password to a variable used for verification
    is_valid = bcrypt.checkpw(password_bytes, stored_hash)
    return is_valid

"""
JWT encode and decode live in `security.py` because signing and verifying tokens are security-critical cryptographic operations, 
and JWT is the mechanism those functions implement to safely issue, trust, and validate authentication tokens.
"""

def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire} # payload is the decoded data section of the token that contains claims like user ID, email, expiration
    access_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return access_token

"""
The payload is the middle part.
It’s a JSON object that contains the claims — the information the token carries.

What each field means
sub (subject)
Identifies who the token belongs to
In your app: usually the user ID
Convention: always a string

exp (expiration)
Unix timestamp or datetime
Tells the library when the token becomes invalid
Enforced automatically during jwt.decode

The payload is how your backend:
Knows who is authenticated
Decides which user to load
Enforces permissions later
"""

def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return payload