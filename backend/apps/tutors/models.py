"""
Vision AI — Tutor Profile Model
"""

from django.db import models

from core.models import BaseModel


class TutorProfile(BaseModel):
    """
    Extended profile for tutors. 1:1 with User.
    Tutors are content creators — their data is focused on content quality
    and upload analytics, NOT on learning behavior (that's students only).
    """
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="tutor_profile",
        db_index=True,
    )
    display_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=1000)

    # Expertise & verification
    subject_expertise = models.JSONField(
        blank=True,
        default=list,
        help_text="List of subjects this tutor is qualified to teach.",
    )
    is_verified = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Admin-verified tutors can upload content to the platform.",
    )
    verification_notes = models.TextField(blank=True)

    # Content analytics (denormalized for fast reads — updated by Celery)
    total_videos_uploaded = models.PositiveIntegerField(default=0)
    total_courses_created = models.PositiveIntegerField(default=0)
    total_student_enrollments = models.PositiveIntegerField(default=0)

    # Aggregate engagement score across all uploaded content
    average_content_engagement_score = models.FloatField(default=0.0)

    class Meta:
        db_table = "tutors_tutorprofile"
        verbose_name = "Tutor Profile"
        indexes = [
            models.Index(fields=["is_verified"], name="idx_tutor_verified"),
        ]

    def __str__(self):
        return f"TutorProfile({self.user.email})"


class TutorAnalytics(BaseModel):
    """
    Aggregated analytics for a tutor's content performance.
    Computed weekly by Celery Beat task.
    Stored separately to avoid bloating TutorProfile.
    """
    tutor = models.OneToOneField(
        TutorProfile,
        on_delete=models.CASCADE,
        related_name="analytics",
    )
    period_start = models.DateField()
    period_end = models.DateField()

    # Aggregate metrics
    total_views = models.PositiveIntegerField(default=0)
    total_watch_time_seconds = models.BigIntegerField(default=0)
    average_completion_rate = models.FloatField(default=0.0)
    average_quiz_pass_rate = models.FloatField(default=0.0)
    top_performing_video_id = models.UUIDField(null=True, blank=True)
    most_rewatched_video_id = models.UUIDField(null=True, blank=True)

    raw_data = models.JSONField(default=dict)  # Full breakdown stored as JSONB

    class Meta:
        db_table = "tutors_tutoranalytics"
        indexes = [
            models.Index(fields=["tutor", "period_start"], name="idx_tutor_analytics_period"),
        ]
