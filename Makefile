.PHONY: up down build migrate test db-psql

up:
\tdocker-compose up -d

down:
\tdocker-compose down

build:
\tdocker-compose build

migrate:
\tdocker-compose exec api alembic upgrade head

test:
\tdocker-compose exec api pytest -q

db-psql:
\tdocker-compose exec db psql -U postgres -d appdb
