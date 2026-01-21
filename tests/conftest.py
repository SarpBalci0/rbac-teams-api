# Test fixtures for DB session, TestClient overrides, and helpers for auth/team operations.

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.api.v1.deps import get_db

from app.models.user import User
from app.models.team import Team
from app.models.membership import Membership


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db_session() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session: Session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clean_database(db_session: Session):
    yield

    db_session.query(Membership).delete()
    db_session.query(Team).delete()
    db_session.query(User).delete()
    db_session.commit()


@pytest.fixture
def register_user(client):
    def _register(email: str, password: str = "password123"):
        return client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password},
        )
    return _register


@pytest.fixture
def login_user(client):
    def _login(email: str, password: str = "password123") -> str:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        return response.json().get("access_token")
    return _login


@pytest.fixture
def auth_header():
    def _header(token: str):
        return {"Authorization": f"Bearer {token}"}
    return _header


@pytest.fixture
def create_team(client, auth_header):
    def _create(token: str, name: str = "Test Team"):
        return client.post(
            "/api/v1/teams",
            json={"name": name},
            headers=auth_header(token),
        )
    return _create