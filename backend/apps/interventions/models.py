"""
VISION Platform — Intervention Models
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class Intervention(TimeStampedModel):
    """
    An adaptive intervention triggered by risk detection.
    Interventions are automatic corrective actions injected into the learning path.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interventions",
    )

    intervention_type = models.CharField(
        max_length=30,
        choices=[
            ("prerequisite_injection", "Inject Prerequisite Lesson"),
            ("simplify_explanation", "Simplify Explanation"),
            ("reduce_complexity", "Reduce Complexity"),
            ("revision_task", "Generate Revision Task"),
            ("targeted_exercise", "Targeted Exercise"),
            ("slow_pacing", "Slow Down Pacing"),
            ("increase_guidance", "Increase AI Guidance"),
            ("break_suggestion", "Suggest Break"),
            ("motivational", "Motivational Nudge"),
        ],
        db_index=True,
    )

    # What triggered this intervention
    trigger_source = models.CharField(
        max_length=30,
        choices=[
            ("failure_prediction", "Failure Prediction"),
            ("dropout_risk", "Dropout Risk"),
            ("engagement_drop", "Engagement Drop"),
            ("repetitive_failure", "Repetitive Failure"),
            ("prerequisite_gap", "Prerequisite Gap"),
            ("inactivity", "Inactivity Detected"),
        ],
    )

    # Linked prediction that caused this
    prediction_id = models.UUIDField(null=True, blank=True)
    trigger_score = models.FloatField(default=0.0)  # the risk score that triggered this

    # Intervention content
    title = models.CharField(max_length=300)
    message = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)  # deep link to action
    target_concept_id = models.UUIDField(null=True, blank=True)
    target_concept_name = models.CharField(max_length=200, blank=True)

    # Lifecycle
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("delivered", "Delivered"),
            ("acknowledged", "Acknowledged"),
            ("completed", "Completed"),
            ("dismissed", "Dismissed"),
            ("expired", "Expired"),
        ],
        default="pending",
        db_index=True,
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Effectiveness tracking (filled after completion)
    was_effective = models.BooleanField(null=True, blank=True)
    effectiveness_score = models.FloatField(null=True, blank=True)  # 0-1

    class Meta:
        db_table = "vision_interventions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["student", "created_at"]),
        ]

    def __str__(self):
        return f"Intervention({self.student.email}, {self.intervention_type}, {self.status})"
