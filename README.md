# RBAC Teams API

A minimal Role-Based Access Control (RBAC) backend built with FastAPI and PostgreSQL. Users can create teams, join teams with roles, and permissions are enforced per role.

## Features

- User registration and login with JWT tokens
- Team creation
- Team membership with roles: `admin`, `member`, `viewer`
- Role-based permission enforcement
- Clean service / dependency / router separation
- PostgreSQL persistence with Alembic migrations

## Tech Stack

- **FastAPI** — web framework
- **PostgreSQL** — database
- **SQLAlchemy** — ORM
- **Alembic** — migrations
- **JWT (python-jose)** — authentication tokens
- **Docker / docker-compose** — local environment

## Project Structure

```
app/
 ├── main.py                # FastAPI app entrypoint
 ├── api/v1/
 │   ├── api.py             # Aggregates all v1 routers
 │   ├── routes/
 │   │   ├── auth.py        # Auth endpoints
 │   │   └── teams.py       # Team & membership endpoints
 │   └── deps.py            # Request-scoped dependencies (auth, RBAC)
 ├── services/
 │   ├── auth_service.py    # Registration, login, token issuance
 │   └── team_service.py    # Team & membership business logic
 ├── models/
 │   ├── user.py            # User model
 │   ├── team.py            # Team model
 │   └── membership.py      # Team membership + role
 ├── schemas/
 │   ├── auth.py            # Auth request/response schemas
 │   └── team.py            # Team request/response schemas
 ├── core/
 │   ├── security.py        # Password hashing & JWT helpers
 │   ├── permissions.py     # Role → action permission map
 │   └── enums.py           # Role enum
 └── db/
     └── session.py         # Database session factory
alembic/
 └── versions/              # Database migrations
tests/
 ├── test_auth.py
 └── test_teams_rbac.py
```

## Architecture Overview

**Request flow:**

```
HTTP Request
   ↓
FastAPI Router (routes/)
   ↓
Dependencies (deps.py)
 - get_db
 - get_current_user (JWT)
 - get_team_by_id
 - require_permission
   ↓
Service Layer (services/)
   ↓
SQLAlchemy Models (models/)
   ↓
Database
```

- The router never directly queries the database
- All business logic lives in services
- Authorization and RBAC live in dependencies

## Database Schema

**users**
- `id` (PK)
- `email` (unique)
- `hashed_password`
- `created_at`

**teams**
- `id` (PK)
- `name`
- `created_at`

**team_memberships**
- `user_id` (PK, FK → users.id)
- `team_id` (PK, FK → teams.id)
- `role` (admin | member | viewer)
- `joined_at`

*Composite primary key (user_id, team_id) ensures a user cannot join the same team twice.*

## RBAC Model

Roles are per team, not global.

**When a user creates a team:**
1. A team row is created
2. A membership row is created
3. The creator gets role `admin` for that team

**Permissions are defined as action strings:**
- `TEAM_READ`
- `TEAM_MEMBER_LIST`
- `TEAM_MEMBER_ADD`

**Role → allowed actions mapping:**
- `admin` → all actions
- `member` → read + list members
- `viewer` → read + list members

**Permission enforcement** happens in a dependency: `require_permission(action)`

This loads:
- Current user from JWT
- Team from path
- Membership from DB
- Checks role → permission map
- Raises 401 / 403 / 404 accordingly

## Authentication

- Users register with email + password
- Passwords are hashed with bcrypt
- Login returns a JWT access token
- Token is sent in requests: `Authorization: Bearer <token>`

## API Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and receive JWT |

### Teams

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| POST | `/api/v1/teams` | Create team | Authenticated |
| GET | `/api/v1/teams/{team_id}` | Get team | `TEAM_READ` |
| POST | `/api/v1/teams/{team_id}/members` | Add member | `TEAM_MEMBER_ADD` |
| GET | `/api/v1/teams/{team_id}/members` | List members | `TEAM_MEMBER_LIST` |

### Status Code Behavior

| Case | Status |
|------|--------|
| Missing or invalid token | 401 |
| Not a team member | 403 |
| Insufficient role permission | 403 |
| Team not found | 404 |
| User already a member | 409 |

## Local Setup

**1) Clone repository**
```bash
git clone <repo-url>
cd rbac-teams-api
```

**2) Start Docker services**
```bash
docker-compose up -d
```

**3) Run migrations**
```bash
docker-compose exec api alembic upgrade head
```

**4) Open API docs**
```
http://127.0.0.1:8000/docs
```

## Manual Usage Flow

1. Register user
2. Login → copy `access_token`
3. Call protected endpoints with header: `Authorization: Bearer <access_token>`
4. Create team → creator becomes admin
5. Add other users as members with roles
6. Permissions enforced automatically

## Running Tests

```bash
pytest
```

Tests cover:
- Auth registration & login
- Team creation
- Membership addition
- RBAC permission enforcement
- Duplicate membership protection

## Design Decisions

**Why per-team roles?**
- Users can have different roles across different teams
- Matches real-world collaboration tools

**Why composite primary key on memberships?**
- Prevents duplicate memberships at DB level
- Ensures reliable 409 conflict handling

**Why service layer?**
- Keeps routers thin and HTTP-focused
- Business logic remains reusable and testable

**Why dependency-based RBAC?**
- Centralizes authorization
- Keeps services HTTP-agnostic
- Makes permission rules reusable across routes

**Why action strings for permissions?**
- Easy to extend
- Clear mapping of role → capabilities

## Future Extensions

- Refresh tokens
- Team deletion
- Role updates
- Invitation-based membership
- OpenAPI Authorization button

