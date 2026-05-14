"""
VISION Platform — Behavioral Tracking Models
The heart of Vision: scalable event ingestion and storage.
Every student interaction is captured as a structured event.
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class EventType(models.TextChoices):
    """
    All trackable behavioral event types.
    These are the raw signals the intelligence engine feeds on.
    """
    # Video/Content interaction
    VIDEO_PLAY = "video_play", "Video Play"
    VIDEO_PAUSE = "video_pause", "Video Pause"
    VIDEO_SEEK = "video_seek", "Video Seek"
    VIDEO_COMPLETE = "video_complete", "Video Complete"
    VIDEO_SKIP = "video_skip", "Video Skip"
    VIDEO_REPLAY = "video_replay", "Video Replay"
    CONTENT_VIEW = "content_view", "Content View"

    # Quiz/Assessment interaction
    QUIZ_START = "quiz_start", "Quiz Start"
    QUIZ_SUBMIT = "quiz_submit", "Quiz Submit"
    QUIZ_RETRY = "quiz_retry", "Quiz Retry"
    QUIZ_ABANDON = "quiz_abandon", "Quiz Abandon"
    QUESTION_ANSWER = "question_answer", "Question Answer"
    HINT_REQUEST = "hint_request", "Hint Request"

    # Navigation
    LESSON_START = "lesson_start", "Lesson Start"
    LESSON_COMPLETE = "lesson_complete", "Lesson Complete"
    LESSON_SKIP = "lesson_skip", "Lesson Skip"
    CONCEPT_REVISIT = "concept_revisit", "Concept Revisit"
    COURSE_NAVIGATION = "course_navigation", "Course Navigation"

    # Engagement signals
    INACTIVITY = "inactivity", "Inactivity Detected"
    SESSION_START = "session_start", "Session Start"
    SESSION_END = "session_end", "Session End"

    # Assignment/Project
    PROJECT_START = "project_start", "Project Start"
    PROJECT_SUBMIT = "project_submit", "Project Submit"
    PROJECT_LATE = "project_late", "Project Late Submission"


class BehavioralEvent(TimeStampedModel):
    """
    Core behavioral event record.
    High-throughput table — every student action writes here.
    Optimized for write speed and time-range queries.

    Schema mirrors the event ingestion spec:
    {
        "user_id": 123,
        "event_type": "quiz_retry",
        "concept": "recursion",
        "response_time": 42,
        "timestamp": "2026-05-14T10:00:00"
    }
    """
    # Identity
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="behavioral_events",
        db_index=True,
    )

    # Event classification
    event_type = models.CharField(
        max_length=50,
        choices=EventType.choices,
        db_index=True,
    )

    # Context references (nullable — not all events have all context)
    course_id = models.UUIDField(null=True, blank=True, db_index=True)
    lesson_id = models.UUIDField(null=True, blank=True, db_index=True)
    quiz_id = models.UUIDField(null=True, blank=True)
    concept_id = models.UUIDField(null=True, blank=True, db_index=True)
    concept_name = models.CharField(max_length=200, blank=True, default="")

    # Behavioral metrics (the raw signal data)
    response_time_seconds = models.FloatField(null=True, blank=True)
    watch_time_seconds = models.FloatField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    attempt_number = models.PositiveSmallIntegerField(null=True, blank=True)
    position_seconds = models.FloatField(null=True, blank=True)  # video position

    # Session tracking
    session_id = models.CharField(max_length=64, blank=True, db_index=True)

    # Raw flexible payload for future extensibility
    metadata = models.JSONField(default=dict)

    # Processing flags
    is_processed = models.BooleanField(default=False, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "vision_behavioral_events"
        ordering = ["-created_at"]
        indexes = [
            # Fast queries by student + time range (most common analytics pattern)
            models.Index(fields=["student", "created_at"]),
            # Query events by type for analytics
            models.Index(fields=["event_type", "created_at"]),
            # Query unprocessed events for Celery pipeline
            models.Index(fields=["is_processed", "created_at"]),
            # Query by concept for concept-level analytics
            models.Index(fields=["concept_id", "event_type"]),
            # Query by course
            models.Index(fields=["course_id", "student", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.event_type}] {self.student.email} @ {self.created_at.isoformat()}"


class LearningSession(TimeStampedModel):
    """
    Groups behavioral events into logical learning sessions.
    A session is a continuous learning period (e.g., 30+ min gap = new session).
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_sessions",
    )
    session_id = models.CharField(max_length=64, unique=True, db_index=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    event_count = models.PositiveIntegerField(default=0)
    courses_accessed = models.JSONField(default=list)
    concepts_studied = models.JSONField(default=list)
    engagement_score = models.FloatField(null=True, blank=True)  # 0-1

    class Meta:
        db_table = "vision_learning_sessions"
        indexes = [
            models.Index(fields=["student", "started_at"]),
        ]


class ConceptMastery(TimeStampedModel):
    """
    Rolling mastery score for a student on a specific concept.
    Updated by the analytics pipeline after every behavioral batch.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="concept_masteries",
    )
    concept_id = models.UUIDField(db_index=True)
    concept_name = models.CharField(max_length=200)

    # Core mastery metrics
    mastery_score = models.FloatField(default=0.0)        # 0-1
    confidence_score = models.FloatField(default=0.0)     # 0-1
    retention_score = models.FloatField(default=0.0)      # 0-1

    # Raw stats
    total_attempts = models.PositiveIntegerField(default=0)
    correct_attempts = models.PositiveIntegerField(default=0)
    avg_response_time = models.FloatField(default=0.0)
    revisit_count = models.PositiveIntegerField(default=0)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "vision_concept_mastery"
        unique_together = ("student", "concept_id")
        indexes = [
            models.Index(fields=["student", "mastery_score"]),
        ]

    def __str__(self):
        return f"{self.student.email} — {self.concept_name}: {self.mastery_score:.2f}"

    @property
    def is_weak(self):
        from django.conf import settings
        threshold = settings.VISION_SETTINGS.get("WEAK_CONCEPT_THRESHOLD", 0.5)
        return self.mastery_score < threshold
