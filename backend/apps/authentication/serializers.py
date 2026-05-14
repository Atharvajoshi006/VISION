"""
VISION Platform — Authentication Serializers
Register, Login, Token Refresh, Password Reset
"""
import uuid
from datetime import timedelta

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, PasswordResetToken, StudentProfile, TutorProfile


class RegisterSerializer(serializers.ModelSerializer):
    """User registration — student or tutor."""
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email", "first_name", "last_name",
            "password", "confirm_password", "role",
        ]
        extra_kwargs = {
            "role": {"required": True},
        }

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Admin accounts cannot be self-registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)

        # Auto-create role-specific profiles
        if user.role == User.Role.STUDENT:
            StudentProfile.objects.create(user=user)
        elif user.role == User.Role.TUTOR:
            TutorProfile.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    """JWT login — returns access + refresh tokens."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Account is deactivated.")

        refresh = RefreshToken.for_user(user)
        user.touch_last_seen()

        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class TokenResponseSerializer(serializers.Serializer):
    """Serializer for token response envelope."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.SerializerMethodField()

    def get_user(self, obj):
        from apps.users.serializers import UserSerializer
        return UserSerializer(obj["user"]).data


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request a password reset email."""
    email = serializers.EmailField()

    def validate_email(self, value):
        # Don't reveal if email exists — silently succeed
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm password reset with token."""
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            reset_token = PasswordResetToken.objects.get(
                token=attrs["token"],
                is_used=False,
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})

        if reset_token.is_expired:
            raise serializers.ValidationError({"token": "Reset token has expired."})

        attrs["reset_token"] = reset_token
        return attrs
