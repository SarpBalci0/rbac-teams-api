# Tests for registration and login behaviors.

def test_register_success(client, register_user):
    res = register_user("user1@example.com", "password123")
    assert res.status_code == 201

    data = res.json()
    assert "id" in data
    assert data["email"] == "user1@example.com"
    assert "created_at" in data


def test_register_duplicate_email_returns_409(client, register_user):
    res1 = register_user("dupe@example.com", "password123")
    assert res1.status_code == 201

    res2 = register_user("dupe@example.com", "password123")
    assert res2.status_code == 409


def test_login_success_returns_token(client, register_user, login_user):
    register_res = register_user("login@example.com", "password123")
    assert register_res.status_code == 201

    token = login_user("login@example.com", "password123")
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 10


def test_login_wrong_password_returns_401(client, register_user):
    register_res = register_user("wrongpw@example.com", "password123")
    assert register_res.status_code == 201

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw@example.com", "password": "wrongpass"},
    )
    assert res.status_code == 401


def test_login_unknown_email_returns_401(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@example.com", "password": "password123"},
    )
    assert res.status_code == 401
