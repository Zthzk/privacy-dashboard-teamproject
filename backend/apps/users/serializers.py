from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Validates registration data and creates a new user."""

    password = serializers.CharField(write_only=True, min_length=8)

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


class PasswordResetRequestSerializer(serializers.Serializer):
    """Validates the email address for a password reset request."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Validates the password reset token and the new password."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

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