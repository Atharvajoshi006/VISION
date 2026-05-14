"""
VISION Platform — Cognitive Profile Serializers + Views + URLs
"""
# ── serializers.py ──────────────────────────────────────────────────────────
from rest_framework import serializers, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.cognitive_profiles.models import CognitiveProfile, ProfileSnapshot


class CognitiveProfileSerializer(serializers.ModelSerializer):
    overall_score = serializers.FloatField(read_only=True)
    feature_vector = serializers.SerializerMethodField()

    class Meta:
        model = CognitiveProfile
        fields = [
            "id",
            "logical_reasoning_strength",
            "pacing_requirement",
            "retention_capability",
            "abstraction_handling",
            "learning_consistency",
            "engagement_stability",
            "visual_tendency",
            "struggle_tendency",
            "recovery_speed",
            "confidence_score",
            "overall_score",
            "total_events_analyzed",
            "last_recalculated_at",
            "profile_version",
            "feature_vector",
            "updated_at",
        ]

    def get_feature_vector(self, obj):
        return obj.to_feature_vector()


class ProfileSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileSnapshot
        fields = ["id", "snapshot_date", "indicators", "overall_score"]
