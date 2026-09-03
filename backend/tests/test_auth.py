from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_signup_login_me():
    email = "test.user@example.com"
    signup_res = client.post("/api/auth/signup", json={
        "full_name": "Test User", "email": email, "password": "supersecret123",
    })
    assert signup_res.status_code in (201, 400)

    login_res = client.post("/api/auth/login", json={"email": email, "password": "supersecret123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email
