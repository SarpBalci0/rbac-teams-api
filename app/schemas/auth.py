from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class Register(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class Login(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime