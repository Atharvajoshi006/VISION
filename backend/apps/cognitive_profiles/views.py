"""
VISION Platform — Cognitive Profile Views
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cognitive_profiles.models import CognitiveProfile, ProfileSnapshot
from apps.cognitive_profiles.serializers import CognitiveProfileSerializer, ProfileSnapshotSerializer
from core.permissions import IsStudent


class MyCognitiveProfileView(generics.RetrieveAPIView):
    """GET /api/v1/profiles/me/ — student's cognitive profile."""
    serializer_class = CognitiveProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = CognitiveProfile.objects.get_or_create(
            student=self.request.user
        )
        return profile


class ProfileHistoryView(generics.ListAPIView):
    """GET /api/v1/profiles/me/history/ — cognitive evolution over time."""
    serializer_class = ProfileSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = CognitiveProfile.objects.get(student=self.request.user)
        return ProfileSnapshot.objects.filter(profile=profile).order_by("-snapshot_date")[:30]


class RefreshProfileView(APIView):
    """POST /api/v1/profiles/me/refresh/ — manually trigger profile recalculation."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.cognitive_profiles.tasks import recalculate_cognitive_profile
        recalculate_cognitive_profile.delay(str(request.user.id))
        return Response({"success": True, "message": "Profile recalculation queued."})


class AdminProfileView(generics.ListAPIView):
    """GET /api/v1/profiles/ — Admin: all student cognitive profiles."""
    serializer_class = CognitiveProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CognitiveProfile.objects.select_related("student").order_by("-updated_at")
