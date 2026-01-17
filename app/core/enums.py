from enum import Enum

class Role(str, Enum):
    admin = "admin"
    member = "member"
    viewer = "viewer"