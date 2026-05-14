"""
Vision AI — Learning Profile Models
The cognitive fingerprint of every student.

Updated incrementally by the Analytics Engine using EMA scoring.
This is what drives the entire personalization system.
"""

from django.db import models

from core.models import BaseModel


class LearningStyle(models.TextChoices):
    VISUAL = "visual", "Visual"
    AUDITORY = "auditory", "Auditory"
    READING_WRITING = "reading_writing", "Reading/Writing"
    KINESTHETIC = "kinesthetic", "Kinesthetic"
    MIXED = "mixed", "Mixed"
    UNKNOWN = "unknown", "Unknown (Insufficient Data)"


class LearningProfile(BaseModel):
    """
    Dynamic cognitive learning profile per student.

    All scores are floats in [0.0, 1.0].
    Updated continuously by the Profile Engine via EMA (exponential moving average).

    Architectural note:
    - mastery_scores, weak_topics, strong_topics are JSONB for topic-level granularity
    - The schema here does NOT need to change as new topics are added
    - Profile evolution is tracked via LearningProfileSnapshot for historical analysis
    """
    student = models.OneToOneField(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="learning_profile",
    )

    # ─── Core Cognitive Scores ─────────────────────────────
    retention_score = models.FloatField(
        default=0.5,
        help_text="How well the student retains material. Driven by rewatch rate, quiz retry rate, quiz score trend.",
    )
    engagement_score = models.FloatField(
        default=0.5,
        help_text="Quality of engagement. Driven by session depth, pause/resume patterns, completion rate.",
    )
    learning_speed_score = models.FloatField(
        default=0.5,
        help_text="How quickly the student progresses relative to estimated lesson durations.",
    )
    difficulty_tolerance = models.FloatField(
        default=0.5,
        help_text="Highest difficulty level the student consistently passes. Scale 0.0–1.0.",
    )
    consistency_score = models.FloatField(
        default=0.5,
        help_text="Regularity of study sessions (streak-based).",
    )

    # ─── Topic Mastery ─────────────────────────────────────
    # Format: {"topic_name": 0.75, "another_topic": 0.4}
    mastery_scores = models.JSONField(
        default=dict,
        help_text="Per-topic mastery score [0.0–1.0]. Updated after every quiz attempt.",
    )

    # Derived from mastery_scores — cached for fast recommendation queries
    # Format: [{"topic": "Algebra", "score": 0.35, "lesson_count": 5}]
    weak_topics = models.JSONField(
        default=list,
        help_text="Topics where mastery < WEAK_TOPIC_THRESHOLD.",
    )
    strong_topics = models.JSONField(
        default=list,
        help_text="Topics where mastery > STRONG_TOPIC_THRESHOLD.",
    )

    # ─── Learning Style ────────────────────────────────────
    preferred_learning_style = models.CharField(
        max_length=20,
        choices=LearningStyle.choices,
        default=LearningStyle.UNKNOWN,
    )

    # ─── Profile Maturity ──────────────────────────────────
    data_points_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of events processed to build this profile. Low count = low confidence.",
    )
    confidence_level = models.FloatField(
        default=0.0,
        help_text="[0.0–1.0] Confidence in the profile scores. Grows with data_points_count.",
    )

    last_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "learning_profiles_learningprofile"
        indexes = [
            models.Index(fields=["student"], name="idx_profile_student"),
            models.Index(fields=["engagement_score"], name="idx_profile_engagement"),
            models.Index(fields=["retention_score"], name="idx_profile_retention"),
        ]

    def __str__(self):
        return f"LearningProfile({self.student.user.email})"

    @property
    def is_mature(self) -> bool:
        """Profile is considered mature after 50+ data points."""
        return self.data_points_count >= 50


class LearningProfileSnapshot(BaseModel):
    """
    Point-in-time snapshot of a LearningProfile.
    Taken daily by Celery Beat for historical trend analysis.
    Allows tracking of profile evolution over time.
    """
    student = models.ForeignKey(
        "students.StudentProfile",
        on_delete=models.CASCADE,
        related_name="profile_snapshots",
    )
    snapshot_date = models.DateField(db_index=True)
    retention_score = models.FloatField()
    engagement_score = models.FloatField()
    learning_speed_score = models.FloatField()
    difficulty_tolerance = models.FloatField()
    mastery_scores = models.JSONField(default=dict)
    data_points_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "learning_profiles_snapshot"
        unique_together = [("student", "snapshot_date")]
        ordering = ["-snapshot_date"]
