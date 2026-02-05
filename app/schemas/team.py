# Pydantic schemas for team create/read and member add/public DTOs.

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.core.enums import Role


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=128)


class TeamPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime


class TeamMemberAdd(BaseModel):
    email: EmailStr
    role: Role = Role.member


class TeamMemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
  
    user_id: int
    role: Role
    joined_at: datetime


class TeamMemberWithEmailPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: EmailStr
    role: Role
    joined_at: datetime


class TeamMemberRoleUpdate(BaseModel):
    role: Role
