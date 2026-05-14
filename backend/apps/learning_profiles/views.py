"""
Vision AI — Learning Profiles Views
"""
from rest_framework import serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.learning_profiles.models import LearningProfile, LearningProfileSnapshot
from core.permissions import IsStudent


class LearningProfileSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = LearningProfile
        fields = [
            "retention_score", "engagement_score", "learning_speed_score",
            "difficulty_tolerance", "consistency_score",
            "mastery_scores", "weak_topics", "strong_topics",
            "preferred_learning_style", "data_points_count",
            "confidence_level", "is_mature", "last_updated_at",
        ]


class MyLearningProfileView(APIView):
    """GET /api/v1/profiles/me/"""
    permission_classes = [IsStudent]

    def get(self, request):
        from django.core.cache import cache
        student = request.user.student_profile
        cache_key = f"vision:profile:{student.id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)
        try:
            profile = student.learning_profile
            data = LearningProfileSerializer(profile).data
            cache.set(cache_key, data, timeout=300)
            return Response(data)
        except LearningProfile.DoesNotExist:
            return Response(
                {"message": "Profile not yet available. Complete some lessons to get started."},
                status=404,
            )


class ProfileHistoryView(APIView):
    """GET /api/v1/profiles/me/history/ — trend data for student dashboard"""
    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user.student_profile
        snapshots = LearningProfileSnapshot.objects.filter(
            student=student
        ).order_by("-snapshot_date")[:30]
        data = [
            {
                "date": s.snapshot_date,
                "retention_score": s.retention_score,
                "engagement_score": s.engagement_score,
                "learning_speed_score": s.learning_speed_score,
            }
            for s in snapshots
        ]
        return Response({"history": data})
