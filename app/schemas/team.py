from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.core.enums import Role

"""
“I enable from_attributes only on response schemas 
 because those receive SQLAlchemy ORM objects, while 
 request schemas receive plain JSON dictionaries and 
 don’t need it.”
"""

class TeamCreate(BaseModel): # used for input (request body)
    name: str = Field(min_length=2, max_length=128)


class TeamPublic(BaseModel): # used for output (response_model)
    model_config = ConfigDict(from_attributes=True) # This schema may be created from an ORM object’s attributes, not only from dictionaries.

    # pydantic must read attributes such as team.id, team.name, so from attributes=True is needed
    id: int
    name: str
    created_at: datetime


class TeamMemberAdd(BaseModel): # used for input, no ORM
    email: EmailStr
    role: Role = Role.member


class TeamMemberPublic(BaseModel): # user for output
    model_config = ConfigDict(from_attributes=True)
   
    # You will return Membership ORM objects (or joined objects)
    # Pydantic must read attributes
  
    user_id: int
    role: Role
    joined_at: datetime


class TeamMemberRoleUpdate(BaseModel):
    """Used to change an existing member's role."""

    role: Role
