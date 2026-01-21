# tests/test_teams_rbac.py


def test_create_team_requires_auth(client):
    res = client.post("/api/v1/teams", json={"name": "NoAuth Team"})
    assert res.status_code == 401


def test_team_creator_is_admin_and_can_read_and_list_members(
    client, register_user, login_user, auth_header, create_team
):
    # Create + login admin user
    res = register_user("admin@example.com", "password123")
    assert res.status_code == 201
    admin_token = login_user("admin@example.com", "password123")
    assert admin_token

    # Create team
    team_res = create_team(admin_token, "Acme")
    assert team_res.status_code == 201
    team = team_res.json()
    team_id = team["id"]

    # Creator can read team
    get_res = client.get(f"/api/v1/teams/{team_id}", headers=auth_header(admin_token))
    assert get_res.status_code == 200

    # Creator can list members
    members_res = client.get(
        f"/api/v1/teams/{team_id}/members", headers=auth_header(admin_token)
    )
    assert members_res.status_code == 200

    members = members_res.json()
    assert isinstance(members, list)
    assert len(members) == 1
    assert members[0]["role"] == "admin"


def test_admin_can_add_member_and_duplicate_returns_409(
    client, register_user, login_user, auth_header, create_team
):
    # Admin
    assert register_user("admin2@example.com", "password123").status_code == 201
    admin_token = login_user("admin2@example.com", "password123")
    assert admin_token

    # Viewer user (target)
    assert register_user("viewer@example.com", "password123").status_code == 201

    # Team
    team_res = create_team(admin_token, "Team1")
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # Add viewer
    add_res = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"email": "viewer@example.com", "role": "viewer"},
        headers=auth_header(admin_token),
    )
    assert add_res.status_code == 201
    added = add_res.json()
    assert added["role"] == "viewer"

    # Duplicate add -> 409
    dup_res = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"email": "viewer@example.com", "role": "viewer"},
        headers=auth_header(admin_token),
    )
    assert dup_res.status_code == 409


def test_admin_can_remove_member(
    client, register_user, login_user, auth_header, create_team
):
    # Admin
    assert register_user("admin-remove@example.com", "password123").status_code == 201
    admin_token = login_user("admin-remove@example.com", "password123")
    assert admin_token

    # Member to remove
    assert register_user("member-remove@example.com", "password123").status_code == 201
    member_token = login_user("member-remove@example.com", "password123")
    assert member_token

    # Team
    team_res = create_team(admin_token, "Remove Team")
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # Admin adds member as viewer
    add_res = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"email": "member-remove@example.com", "role": "viewer"},
        headers=auth_header(admin_token),
    )
    assert add_res.status_code == 201
    membership = add_res.json()
    user_id = membership["user_id"]

    # Admin removes member
    delete_res = client.delete(
        f"/api/v1/teams/{team_id}/members/{user_id}",
        headers=auth_header(admin_token),
    )
    assert delete_res.status_code == 204

    # Member no longer appears in members list
    members_res = client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_header(admin_token),
    )
    assert members_res.status_code == 200
    members = members_res.json()
    assert all(m["user_id"] != user_id for m in members)


def test_admin_can_change_member_role(
    client, register_user, login_user, auth_header, create_team
):
    # Admin
    assert register_user("admin-role@example.com", "password123").status_code == 201
    admin_token = login_user("admin-role@example.com", "password123")
    assert admin_token

    # Member whose role will be changed
    assert register_user("member-role@example.com", "password123").status_code == 201

    # Team
    team_res = create_team(admin_token, "Role Team")
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # Admin adds member as viewer
    add_res = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"email": "member-role@example.com", "role": "viewer"},
        headers=auth_header(admin_token),
    )
    assert add_res.status_code == 201
    membership = add_res.json()
    user_id = membership["user_id"]
    assert membership["role"] == "viewer"

    # Admin changes role to admin
    patch_res = client.patch(
        f"/api/v1/teams/{team_id}/members/{user_id}",
        json={"role": "admin"},
        headers=auth_header(admin_token),
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["user_id"] == user_id
    assert updated["role"] == "admin"

    # Members list reflects new role
    members_res = client.get(
        f"/api/v1/teams/{team_id}/members",
        headers=auth_header(admin_token),
    )
    assert members_res.status_code == 200
    members = members_res.json()
    roles = {m["user_id"]: m["role"] for m in members}
    assert roles[user_id] == "admin"


def test_viewer_can_read_but_cannot_add_member(
    client, register_user, login_user, auth_header, create_team
):
    # Admin
    assert register_user("admin3@example.com", "password123").status_code == 201
    admin_token = login_user("admin3@example.com", "password123")
    assert admin_token

    # Viewer
    assert register_user("viewer2@example.com", "password123").status_code == 201
    viewer_token = login_user("viewer2@example.com", "password123")
    assert viewer_token

    # Outsider to add later
    assert register_user("newguy@example.com", "password123").status_code == 201

    # Team
    team_res = create_team(admin_token, "Team2")
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # Admin adds viewer as viewer
    add_viewer_res = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"email": "viewer2@example.com", "role": "viewer"},
        headers=auth_header(admin_token),
    )
    assert add_viewer_res.status_code == 201

    # Viewer can read team
    read_res = client.get(f"/api/v1/teams/{team_id}", headers=auth_header(viewer_token))
    assert read_res.status_code == 200

    # Viewer can list members
    members_res = client.get(
        f"/api/v1/teams/{team_id}/members", headers=auth_header(viewer_token)
    )
    assert members_res.status_code == 200

    # Viewer cannot add member
    add_res = client.post(
        f"/api/v1/teams/{team_id}/members",
        json={"email": "newguy@example.com", "role": "member"},
        headers=auth_header(viewer_token),
    )
    assert add_res.status_code == 403


def test_non_member_cannot_read_team(
    client, register_user, login_user, auth_header, create_team
):
    # Admin
    assert register_user("admin4@example.com", "password123").status_code == 201
    admin_token = login_user("admin4@example.com", "password123")
    assert admin_token

    # Outsider (not added to team)
    assert register_user("outsider@example.com", "password123").status_code == 201
    outsider_token = login_user("outsider@example.com", "password123")
    assert outsider_token

    # Team
    team_res = create_team(admin_token, "Team3")
    assert team_res.status_code == 201
    team_id = team_res.json()["id"]

    # Outsider cannot read team
    read_res = client.get(
        f"/api/v1/teams/{team_id}", headers=auth_header(outsider_token)
    )
    assert read_res.status_code == 403

    # Outsider cannot list members
    members_res = client.get(
        f"/api/v1/teams/{team_id}/members", headers=auth_header(outsider_token)
    )
    assert members_res.status_code == 403
