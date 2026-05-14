"""
VISION Platform — Recommendation Models
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class Recommendation(TimeStampedModel):
    """A personalized learning recommendation for a student."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )

    recommendation_type = models.CharField(
        max_length=30,
        choices=[
            ("lesson", "Study This Lesson"),
            ("concept_review", "Review This Concept"),
            ("quiz", "Take This Quiz"),
            ("slow_down", "Slow Down Pacing"),
            ("increase_difficulty", "Increase Difficulty"),
            ("decrease_difficulty", "Decrease Difficulty"),
            ("prerequisite", "Study Prerequisite First"),
            ("revision", "Revision Session"),
            ("project", "Work on Project"),
            ("break", "Take a Break"),
        ],
        db_index=True,
    )

    # What is being recommended
    target_concept_id = models.UUIDField(null=True, blank=True)
    target_concept_name = models.CharField(max_length=200, blank=True)
    target_lesson_id = models.UUIDField(null=True, blank=True)
    target_course_id = models.UUIDField(null=True, blank=True)

    title = models.CharField(max_length=300)
    description = models.TextField()
    priority = models.PositiveSmallIntegerField(default=5)  # 1=highest, 10=lowest
    difficulty_adjustment = models.SmallIntegerField(default=0)  # -3 to +3

    # Recommendation inputs (what triggered this)
    triggered_by = models.CharField(
        max_length=30,
        choices=[
            ("weak_mastery", "Weak Mastery"),
            ("high_failure_risk", "High Failure Risk"),
            ("engagement_drop", "Engagement Drop"),
            ("prerequisite_gap", "Prerequisite Gap"),
            ("pacing_mismatch", "Pacing Mismatch"),
            ("retention_decline", "Retention Decline"),
            ("cognitive_profile", "Cognitive Profile"),
        ],
        blank=True,
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_dismissed = models.BooleanField(default=False)
    acted_on = models.BooleanField(default=False)
    acted_on_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "vision_recommendations"
        ordering = ["priority", "-created_at"]
        indexes = [
            models.Index(fields=["student", "is_active", "is_dismissed"]),
        ]
