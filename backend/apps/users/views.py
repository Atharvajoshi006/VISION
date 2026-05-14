"""
VISION Platform — User Views
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from django.contrib.auth import update_session_auth_hash

from apps.users.models import User, StudentProfile, TutorProfile
from apps.users.serializers import (
    UserDetailSerializer, UserUpdateSerializer,
    StudentProfileSerializer, TutorProfileSerializer,
    ChangePasswordSerializer, UserSerializer,
)
from core.permissions import IsAdmin, IsOwnerOrAdmin


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/users/me/ — current user's own profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserDetailSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(generics.GenericAPIView):
    """POST /api/v1/users/me/change-password/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"success": True, "message": "Password updated successfully."})


class StudentProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/users/me/student-profile/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentProfileSerializer

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class TutorProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/users/me/tutor-profile/"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TutorProfileSerializer

    def get_object(self):
        profile, _ = TutorProfile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


class AdminUserListView(generics.ListAPIView):
    """GET /api/v1/users/ — Admin: list all users."""
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["date_joined", "last_seen"]

    def get_queryset(self):
        return User.objects.all().select_related(
            "student_profile", "tutor_profile"
        ).order_by("-date_joined")


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/users/<id>/ — Admin management."""
    permission_classes = [IsAdmin]
    serializer_class = UserDetailSerializer
    queryset = User.objects.all()
