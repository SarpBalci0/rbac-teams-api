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


# ---------- Create Tables Before Tests ----------

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """
    Create all database tables before running tests.
    This runs once per test session.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # Optional: drop tables after all tests (commented out to preserve data)
    # Base.metadata.drop_all(bind=engine)


# ---------- Database Session Fixture ----------

@pytest.fixture
def db_session() -> Session:
    """
    Creates a database session for tests.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- Dependency Override ----------

@pytest.fixture
def client(db_session: Session):
    """
    Provides TestClient with overridden get_db dependency
    so API uses the test database session.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ---------- Automatic Database Cleanup ----------

@pytest.fixture(autouse=True)
def clean_database(db_session: Session):
    """
    Ensures each test runs with a clean database.
    """
    # Run test
    yield

    # Cleanup after test (order matters due to foreign keys)
    db_session.query(Membership).delete()
    db_session.query(Team).delete()
    db_session.query(User).delete()
    db_session.commit()


# ---------- Helper Functions ----------

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
