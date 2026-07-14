from django.test import TestCase

# Create your tests here.
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        """Sets up a test user and auth endpoint URLs."""
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

    def test_user_can_login_with_valid_credentials(self):
        """Tests that valid credentials return access and refresh tokens."""
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
        """Tests that invalid credentials are rejected."""
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
        """Tests that the current user endpoint requires authentication."""
        response = self.client.get(self.current_user_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_returns_authenticated_user(self):
        """Tests that an authenticated user can retrieve their own user data."""
        access_token = self._get_access_token()

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.current_user_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.username)
        self.assertEqual(response.data["email"], "testuser@example.com")

    def test_refresh_token_returns_new_access_token(self):
        """Tests that a valid refresh token returns a new access token."""
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
        """Returns a valid access token for authenticated test requests."""
        response = self.client.post(
            self.login_url,
            {
                "username": self.username,
                "password": self.password,
            },
            format="json",
        )

        return response.data["access"]
    
    # Register tests
    
    def test_user_can_register_with_valid_data(self):
        """Tests that valid registration data creates a new user."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "Securepassword123?",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["username"], "newuser")
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_user_cannot_register_with_existing_username(self):
        """Tests that duplicate usernames are rejected."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": self.username,
                "email": "another@example.com",
                "password": "securepassword123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_user_cannot_register_with_existing_email(self):
        """Tests that duplicate emails are rejected."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "anotheruser",
                "email": "testuser@example.com",
                "password": "securepassword123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_user_cannot_register_with_short_password(self):
        """Tests that short passwords are rejected."""
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "shortpassuser",
                "email": "short@example.com",
                "password": "1234",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)