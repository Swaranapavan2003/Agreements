import pytest
from httpx import AsyncClient

REGISTER_DATA = {
    "email": "test@example.com",
    "password": "SecurePass123",
    "first_name": "Test",
    "last_name": "User",
    "organization_name": "Test Corp"
}

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await client.post("/api/v1/auth/register", json=REGISTER_DATA)
    resp = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
    assert resp.status_code == 409

@pytest.mark.asyncio
async def test_login_unverified_user(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={**REGISTER_DATA, "email": "unverified@example.com"})
    resp = await client.post("/api/v1/auth/login", json={"email": "unverified@example.com", "password": "SecurePass123"})
    assert resp.status_code == 401
    assert resp.json()["error"] == "EMAIL_NOT_VERIFIED"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "wrongpass"})
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_forgot_password_unknown_email(client: AsyncClient):
    resp = await client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})
    assert resp.status_code == 200  # Must not reveal existence

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
