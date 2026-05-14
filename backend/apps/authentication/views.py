"""
VISION Platform — Authentication Views
Register, Login, Token Refresh, Logout, Password Reset
"""
import uuid
import logging
from datetime import timedelta

from django.utils import timezone
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, PasswordResetToken
from apps.authentication.serializers import (
    RegisterSerializer, LoginSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)
from apps.users.serializers import UserDetailSerializer

logger = logging.getLogger("vision")


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/
    Register a new Student or Tutor account.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue JWT tokens on registration
        refresh = RefreshToken.for_user(user)

        logger.info(
            "user_registered",
            extra={"user_id": str(user.id), "role": user.role, "email": user.email},
        )

        return Response(
            {
                "success": True,
                "message": "Account created successfully.",
                "data": {
                    "user": UserDetailSerializer(user).data,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticate user and return JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        logger.info(
            "user_login",
            extra={"user_id": str(data["user"].id), "role": data["user"].role},
        )

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "data": {
                    "user": UserDetailSerializer(data["user"]).data,
                    "access": data["access"],
                    "refresh": data["refresh"],
                },
            }
        )


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the refresh token to invalidate the session.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "error": {"message": "Refresh token is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(
                "user_logout",
                extra={"user_id": str(request.user.id)},
            )
        except Exception:
            pass  # Token already invalid — still 200

        return Response({"success": True, "message": "Logged out successfully."})


class TokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/token/refresh/
    Refresh the access token using a valid refresh token.
    """
    pass


class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/password-reset/
    Initiate password reset — sends email with token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email, is_active=True)
            token = uuid.uuid4().hex + uuid.uuid4().hex  # 64-char token
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=1),
            )
            # TODO: Send email via Celery task
            logger.info("password_reset_requested", extra={"email": email})
        except User.DoesNotExist:
            pass  # Silent fail — don't reveal if email exists

        return Response({
            "success": True,
            "message": "If that email exists, a reset link has been sent.",
        })


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/password-reset/confirm/
    Complete password reset with token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_token = serializer.validated_data["reset_token"]
        reset_token.user.set_password(serializer.validated_data["new_password"])
        reset_token.user.save()
        reset_token.is_used = True
        reset_token.save()

        logger.info(
            "password_reset_completed",
            extra={"user_id": str(reset_token.user.id)},
        )
        return Response({"success": True, "message": "Password has been reset successfully."})
