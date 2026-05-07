from django.test import TestCase

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


User = get_user_model()


class AuthenticationTests(TestCase):
    """Tests for JWT authentication and protected backend endpoints."""

    def setUp(self):
        """Create a test user and initialize the API client before each test."""
        self.client = APIClient()

        self.username = "admin"
        self.password = "1234"

        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email="testuser@example.com",
        )

        self.login_url = "/api/auth/login/"
        self.refresh_url = "/api/auth/refresh/"
        self.current_user_url = "/api/auth/me/"
        self.projects_url = "/api/projects/"

    def test_user_can_login_with_valid_credentials(self):
        """A user should receive access and refresh tokens with valid credentials."""
        response = self.client.post(
            self.login_url,
            {
                "username": self.username,
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_user_cannot_login_with_invalid_credentials(self):
        """A user should not receive tokens with invalid credentials."""
        response = self.client.post(
            self.login_url,
            {
                "username": self.username,
                "password": "wrong-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("access", response.data)
        self.assertNotIn("refresh", response.data)

    def test_current_user_requires_authentication(self):
        """The current-user endpoint should reject unauthenticated requests."""
        response = self.client.get(self.current_user_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_returns_authenticated_user(self):
        """The current-user endpoint should return the logged-in user's data."""
        access_token = self._get_access_token()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.current_user_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.username)
        self.assertEqual(response.data["email"], "testuser@example.com")

    def test_projects_endpoint_requires_authentication(self):
        """Project data should not be visible without authentication."""
        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_projects_endpoint_allows_authenticated_user(self):
        """Project data should be visible for authenticated users."""
        access_token = self._get_access_token()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.projects_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

    def test_refresh_token_returns_new_access_token(self):
        """A refresh token should return a new access token."""
        login_response = self.client.post(
            self.login_url,
            {
                "username": self.username,
                "password": self.password,
            },
            format="json",
        )

        refresh_token = login_response.data["refresh"]

        response = self.client.post(
            self.refresh_url,
            {
                "refresh": refresh_token,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def _get_access_token(self):
        """Helper method to log in and return a valid access token."""
        response = self.client.post(
            self.login_url,
            {
                "username": self.username,
                "password": self.password,
            },
            format="json",
        )

        return response.data["access"]
