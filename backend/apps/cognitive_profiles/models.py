"""
VISION Platform — Cognitive Profile Models
Dynamic student cognition modeling system.
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class CognitiveProfile(TimeStampedModel):
    """
    The living cognitive model of a student.
    Continuously updated by the profiling engine.
    All scores are 0.0 → 1.0.
    """
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cognitive_profile",
    )

    # ── Core Cognitive Indicators ───────────────────────────────────────────
    logical_reasoning_strength = models.FloatField(default=0.5)
    """How well the student handles logical/sequential problems."""

    pacing_requirement = models.FloatField(default=0.5)
    """How much time the student needs relative to peers. Higher = needs more time."""

    retention_capability = models.FloatField(default=0.5)
    """How well concepts stick after initial learning."""

    abstraction_handling = models.FloatField(default=0.5)
    """Ability to work with abstract concepts vs. concrete examples."""

    learning_consistency = models.FloatField(default=0.5)
    """Regularity of study patterns. High = consistent daily learner."""

    engagement_stability = models.FloatField(default=0.5)
    """Stability of engagement over time. Low = volatile interest."""

    # ── Learning Style ──────────────────────────────────────────────────────
    visual_tendency = models.FloatField(default=0.5)
    """0 = strongly theoretical, 1 = strongly visual."""

    # ── Derived Risk Indicators ─────────────────────────────────────────────
    struggle_tendency = models.FloatField(default=0.0)
    """Aggregated measure of struggle signals. High = at-risk."""

    recovery_speed = models.FloatField(default=0.5)
    """How quickly the student bounces back after failure."""

    # ── Profile Health ───────────────────────────────────────────────────────
    confidence_score = models.FloatField(default=0.0)
    """How confident we are in this profile (based on data volume). 0-1."""

    total_events_analyzed = models.PositiveIntegerField(default=0)
    last_recalculated_at = models.DateTimeField(null=True, blank=True)
    profile_version = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "vision_cognitive_profiles"

    def __str__(self):
        return f"CognitiveProfile({self.student.email}) v{self.profile_version}"

    @property
    def overall_score(self):
        """Weighted overall cognitive performance score."""
        return (
            self.logical_reasoning_strength * 0.25
            + self.retention_capability * 0.25
            + (1 - self.pacing_requirement) * 0.15
            + self.abstraction_handling * 0.15
            + self.learning_consistency * 0.10
            + self.engagement_stability * 0.10
        )

    def to_feature_vector(self) -> list:
        """Convert profile to ML feature vector for prediction models."""
        return [
            self.logical_reasoning_strength,
            self.pacing_requirement,
            self.retention_capability,
            self.abstraction_handling,
            self.learning_consistency,
            self.engagement_stability,
            self.visual_tendency,
            self.struggle_tendency,
            self.recovery_speed,
            self.confidence_score,
        ]


class ProfileSnapshot(TimeStampedModel):
    """
    Historical snapshot of a cognitive profile.
    Stored daily to track cognitive evolution over time.
    """
    profile = models.ForeignKey(
        CognitiveProfile,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    snapshot_date = models.DateField(db_index=True)
    indicators = models.JSONField(default=dict)
    overall_score = models.FloatField(default=0.0)

    class Meta:
        db_table = "vision_profile_snapshots"
        unique_together = ("profile", "snapshot_date")
        ordering = ["-snapshot_date"]
