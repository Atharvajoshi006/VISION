"""
VISION Platform — Analytics Models
Analytics snapshots, feature stores, and trend data.
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class AnalyticsSnapshot(TimeStampedModel):
    """
    Daily analytics snapshot for a student.
    Aggregated from behavioral events and stored for trend analysis.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="analytics_snapshots",
    )
    snapshot_date = models.DateField(db_index=True)

    # Engagement metrics
    study_time_minutes = models.FloatField(default=0.0)
    session_count = models.PositiveSmallIntegerField(default=0)
    events_count = models.PositiveIntegerField(default=0)
    engagement_score = models.FloatField(default=0.0)       # 0-1

    # Performance metrics
    avg_quiz_score = models.FloatField(null=True, blank=True)
    quizzes_attempted = models.PositiveSmallIntegerField(default=0)
    lessons_completed = models.PositiveSmallIntegerField(default=0)
    concepts_studied = models.PositiveSmallIntegerField(default=0)

    # Struggle metrics
    retry_count = models.PositiveSmallIntegerField(default=0)
    hint_requests = models.PositiveSmallIntegerField(default=0)
    inactivity_events = models.PositiveSmallIntegerField(default=0)
    skipped_lessons = models.PositiveSmallIntegerField(default=0)

    # Derived scores (computed by analytics pipeline)
    performance_score = models.FloatField(default=0.0)     # 0-1
    consistency_score = models.FloatField(default=0.0)     # 0-1

    class Meta:
        db_table = "vision_analytics_snapshots"
        unique_together = ("student", "snapshot_date")
        indexes = [
            models.Index(fields=["student", "snapshot_date"]),
        ]


class ConceptAnalytics(TimeStampedModel):
    """
    Aggregated analytics per concept across all students.
    Used for tutor heatmaps and platform-wide weak concept detection.
    """
    concept_id = models.UUIDField(db_index=True)
    concept_name = models.CharField(max_length=200)
    analyzed_date = models.DateField(db_index=True)

    # Platform-wide stats
    avg_mastery = models.FloatField(default=0.0)
    student_count = models.PositiveIntegerField(default=0)
    struggling_students = models.PositiveIntegerField(default=0)
    avg_retry_count = models.FloatField(default=0.0)
    avg_response_time = models.FloatField(default=0.0)

    class Meta:
        db_table = "vision_concept_analytics"
        unique_together = ("concept_id", "analyzed_date")


class EngagementTrend(TimeStampedModel):
    """
    Weekly engagement trend for a student.
    Used for dropout risk detection.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="engagement_trends",
    )
    week_start = models.DateField(db_index=True)
    engagement_score = models.FloatField(default=0.0)
    trend_direction = models.CharField(
        max_length=10,
        choices=[("up", "Improving"), ("down", "Declining"), ("stable", "Stable")],
        default="stable",
    )
    slope = models.FloatField(default=0.0)  # rate of change

    class Meta:
        db_table = "vision_engagement_trends"
        unique_together = ("student", "week_start")
