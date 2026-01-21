# Pydantic schemas for team create/read and member add/public DTOs.

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.core.enums import Role


class TeamCreate(BaseModel): # used for input, no ORM
    name: str = Field(min_length=2, max_length=128)


class TeamPublic(BaseModel): # used for output 
    model_config = ConfigDict(from_attributes=True) # This schema may be created from an ORM object’s attributes, not only from dictionaries.

    id: int
    name: str
    created_at: datetime


class TeamMemberAdd(BaseModel): # used for input, no ORM
    email: EmailStr
    role: Role = Role.member


class TeamMemberPublic(BaseModel): # user for output
    model_config = ConfigDict(from_attributes=True)
  
    user_id: int
    role: Role
    joined_at: datetime


class TeamMemberRoleUpdate(BaseModel):
    role: Role
