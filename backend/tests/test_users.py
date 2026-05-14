import pytest
from rest_framework.test import APIClient
from apps.users.models import User


@pytest.mark.django_db
def test_user_registration():
    client = APIClient()
    payload = {
        "email": "alice@example.com",
        "password": "StrongPass!123",
        "password2": "StrongPass!123",
        "first_name": "Alice",
        "last_name": "Liddell",
    }
    resp = client.post("/api/users/register/", payload, format="json")
    assert resp.status_code == 201
    assert User.objects.filter(email="alice@example.com").exists()


@pytest.mark.django_db
def test_login_and_me():
    # create a user first
    user = User.objects.create_user(email="bob@example.com", password="Secret123")
    client = APIClient()
    resp = client.post(
        "/api/users/login/obtain_token/",
        {"email": "bob@example.com", "password": "Secret123"},
        format="json",
    )
    assert resp.status_code == 200
    access = resp.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    # get me endpoint
    resp = client.get("/api/users/me/")
    assert resp.status_code == 200
    assert resp.data["email"] == "bob@example.com"
