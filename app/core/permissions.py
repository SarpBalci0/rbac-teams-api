from __future__ import annotations

from app.core.enums import Role

# ---- Actions (permission names) ----
TEAM_READ = "team:read"
TEAM_MEMBER_LIST = "team:member:list"
TEAM_MEMBER_ADD = "team:member:add"

# ---- Role -> allowed actions ----
ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.viewer: {
        TEAM_READ,
        TEAM_MEMBER_LIST,
    },
    Role.member: {
        TEAM_READ,
        TEAM_MEMBER_LIST,
    },
    Role.admin: {
        TEAM_READ,
        TEAM_MEMBER_LIST,
        TEAM_MEMBER_ADD,
    },
}

def role_allows(role: Role, action: str) -> bool:
    """
    Returns True if the given role is allowed to perform the action.
    Unknown roles default to False.
    """
    return action in ROLE_PERMISSIONS.get(role, set())