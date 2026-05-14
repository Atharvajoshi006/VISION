"""
VISION Platform — Behavioral Tracking Serializers
High-throughput event ingestion serializers.
"""
from rest_framework import serializers
from apps.tracking.models import BehavioralEvent, LearningSession, ConceptMastery, EventType


class BehavioralEventIngestSerializer(serializers.ModelSerializer):
    """
    Primary event ingestion serializer.
    Accepts the canonical Vision event schema:
    {
        "event_type": "quiz_retry",
        "concept_name": "recursion",
        "concept_id": "uuid",
        "response_time_seconds": 42,
        "metadata": {...}
    }
    """
    event_type = serializers.ChoiceField(choices=EventType.choices)

    class Meta:
        model = BehavioralEvent
        fields = [
            "event_type",
            "course_id",
            "lesson_id",
            "quiz_id",
            "concept_id",
            "concept_name",
            "response_time_seconds",
            "watch_time_seconds",
            "score",
            "attempt_number",
            "position_seconds",
            "session_id",
            "metadata",
        ]

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return super().create(validated_data)


class BulkEventIngestSerializer(serializers.Serializer):
    """
    Batch event ingestion — up to 50 events per request.
    Reduces HTTP overhead for high-frequency interactions (video tracking).
    """
    events = BehavioralEventIngestSerializer(many=True, max_length=50)

    def validate_events(self, events):
        if not events:
            raise serializers.ValidationError("At least one event is required.")
        return events


class BehavioralEventSerializer(serializers.ModelSerializer):
    """Read serializer for event history queries."""
    student_email = serializers.CharField(source="student.email", read_only=True)

    class Meta:
        model = BehavioralEvent
        fields = [
            "id", "student", "student_email", "event_type",
            "course_id", "lesson_id", "quiz_id",
            "concept_id", "concept_name",
            "response_time_seconds", "watch_time_seconds",
            "score", "attempt_number", "position_seconds",
            "session_id", "metadata", "is_processed",
            "created_at",
        ]
        read_only_fields = fields


class LearningSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningSession
        fields = [
            "id", "session_id", "started_at", "ended_at",
            "duration_seconds", "event_count",
            "courses_accessed", "concepts_studied", "engagement_score",
            "created_at",
        ]


class ConceptMasterySerializer(serializers.ModelSerializer):
    is_weak = serializers.BooleanField(read_only=True)

    class Meta:
        model = ConceptMastery
        fields = [
            "id", "concept_id", "concept_name",
            "mastery_score", "confidence_score", "retention_score",
            "total_attempts", "correct_attempts", "avg_response_time",
            "revisit_count", "last_reviewed_at", "is_weak",
            "created_at", "updated_at",
        ]
