# Full‑Stack RBAC Teams: FastAPI + PostgreSQL + React

A full‑stack RBAC project with a FastAPI backend, PostgreSQL database, and Vite React frontend.
It supports user auth, team creation, and role‑based membership management.

## What you get
- JWT auth (register/login)
- Teams and memberships
- RBAC roles: admin / member / viewer
- Dockerized Postgres + API
- Alembic migrations
- Test suite (pytest)

## Architecture (short)
Request → Router → Dependencies (auth/RBAC) → Services → Models → DB

## Quickstart

### 1) Start backend (API + DB)
```bash
docker compose up -d
```

### 2) Run migrations (required)
```bash
docker compose exec api alembic upgrade head
```
⚠️ The API will return 500 errors if migrations are not applied.

### 3) Start frontend (Vite dev server on 5173)
```bash
cd frontend
npm install
npm run dev
```

## Repo hygiene
- **Do not commit `node_modules/`** (it is machine-specific, huge, and makes diffs unusable).
- **Lockfiles stay committed**: `frontend/package-lock.json` must remain tracked to keep installs reproducible.
- Install / build the frontend like this:
```bash
cd frontend
npm ci        # preferred in CI and when package-lock.json is present
# or: npm install
npm run dev
npm run build
```

### 4) Open
- API docs: `http://127.0.0.1:8000/docs`
- App: `http://localhost:5173`

## Environment & configuration
Backend environment is provided by `docker-compose.yml`. These values have defaults in compose:
- `APP_ENV`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`

You only need to set custom values if you want to override the defaults.

Frontend:
- `frontend/.env` is optional. It’s only needed if you want to override the default API base URL.
- Default is `VITE_API_URL=http://127.0.0.1:8000` (see `frontend/.env`).

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and receive JWT |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/teams` | Create team |
| GET | `/api/v1/teams/{team_id}` | Get team |
| GET | `/api/v1/teams/{team_id}/members` | List members |
| POST | `/api/v1/teams/{team_id}/members` | Add member |
| PATCH | `/api/v1/teams/{team_id}/members/{user_id}` | Change member role |
| DELETE | `/api/v1/teams/{team_id}/members/{user_id}` | Remove member |

**Common status codes**
- `401` Missing/invalid token
- `403` Not a member / insufficient permission
- `404` Team or membership not found
- `409` User already a member

## RBAC model
Roles are per‑team:
- `admin` → all actions
- `member` → read + list members
- `viewer` → read + list members

Examples:
- Only admins can add/remove members.
- Members and viewers can list team members but cannot modify them.

Permissions are defined in `app/core/permissions.py` and enforced via `require_permission`.

## Tests
```bash
docker compose exec api pytest -q
```

## Troubleshooting
- **500 errors from API**: migrations are missing.
  ```bash
  docker compose exec api alembic upgrade head
  ```
- **CORS blocked in browser**: frontend must run on `http://localhost:5173` (see `app/main.py`).

## Repo structure
```
app/         # FastAPI app (routers, deps, services, models)
alembic/     # Migrations
tests/       # Pytest suite
frontend/    # Vite React app
```

## Notes
- Docker services are named `db` and `api` in `docker-compose.yml`.
- A Makefile exists, but it uses legacy `docker-compose`. Prefer `docker compose` unless you need the Make targets.
