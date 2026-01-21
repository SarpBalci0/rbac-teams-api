# Role enum (admin, member, viewer).

from enum import Enum

class Role(str, Enum):
    admin = "admin"
    member = "member"
    viewer = "viewer"