#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

MAX_RETRIES=${DB_CONNECT_RETRIES:-30}
SLEEP_SECS=${DB_CONNECT_SLEEP:-1}

python - <<'PY'
import os
import sys
import time
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

url = os.environ.get("DATABASE_URL")
retries = int(os.environ.get("DB_CONNECT_RETRIES", "30"))
sleep_secs = float(os.environ.get("DB_CONNECT_SLEEP", "1"))

engine = create_engine(url)

for attempt in range(1, retries + 1):
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        print("Database is ready")
        break
    except OperationalError as exc:
        print(f"Database not ready (attempt {attempt}/{retries}): {exc}")
        time.sleep(sleep_secs)
else:
    print("Database never became ready", file=sys.stderr)
    sys.exit(1)
PY

echo "Running migrations..."
alembic upgrade head

echo "Starting API..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
