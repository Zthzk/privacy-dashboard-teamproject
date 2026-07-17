import re
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

User = get_user_model()

def validate_strong_password(value):
    """Require passwords that are harder to guess."""
    errors = []

    # Enforce a minimum length so short passwords are rejected.
    if len(value) < 10:
        errors.append("Password must be at least 10 characters long.")

    # Require different character groups to make passwords less predictable.
    if not re.search(r"[A-Z]", value):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"\d", value):
        errors.append("Password must contain at least one number.")
    if not re.search(r"[^A-Za-z0-9]", value):
        errors.append("Password must contain at least one special character.")

    if errors:
        raise serializers.ValidationError(errors)

    return value

class RegisterSerializer(serializers.ModelSerializer):
    """Validates registration data and creates a new user."""

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, value):
        """Tests that the username is not already used."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        """Tests that the email is not already used."""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already taken.")
        return value

    def create(self, validated_data):
        """Creates a new user with a hashed password."""
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
    def validate_password(self, value):
        """Validate registration passwords with the shared strong-password rules."""
        return validate_strong_password(value)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Validates the email address for a password reset request."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Validates the password reset token and the new password."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        """Validate reset passwords with the shared strong-password rules."""
        return validate_strong_password(value)

    def validate(self, attrs):
        """Tests that the reset token belongs to a valid user."""
        try:
            uid = urlsafe_base64_decode(attrs["uid"]).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid password reset link.")

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError("Invalid or expired password reset token.")

        attrs["user"] = user
        return attrs

    def save(self):
        """Sets a new password for the user."""
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user