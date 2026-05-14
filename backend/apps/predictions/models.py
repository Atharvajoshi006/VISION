"""
VISION Platform — Prediction Models
Stores ML prediction scores and model metadata.
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class PredictionScore(TimeStampedModel):
    """
    ML-generated risk scores for a student.
    Updated by the prediction pipeline after every behavioral batch.
    All scores: 0.0 (low risk) → 1.0 (high risk).
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prediction_scores",
    )

    # ── Core Risk Predictions ─────────────────────────────────────────────
    failure_probability = models.FloatField(default=0.0)
    """Probability of failing current concepts being studied."""

    dropout_risk = models.FloatField(default=0.0)
    """Probability of student dropping out of the course."""

    disengagement_risk = models.FloatField(default=0.0)
    """Probability of significant engagement decline."""

    pacing_mismatch_score = models.FloatField(default=0.0)
    """Degree of mismatch between student pace and course speed."""

    retention_decline_risk = models.FloatField(default=0.0)
    """Risk that learned concepts are being forgotten."""

    # ── Composite Risk Level ──────────────────────────────────────────────
    overall_risk_level = models.CharField(
        max_length=10,
        choices=[
            ("low", "Low Risk"),
            ("medium", "Medium Risk"),
            ("high", "High Risk"),
            ("critical", "Critical"),
        ],
        default="low",
        db_index=True,
    )

    # ── Model metadata ────────────────────────────────────────────────────
    model_version = models.CharField(max_length=50, default="v1.0")
    feature_snapshot = models.JSONField(default=dict)  # features used for this prediction
    confidence = models.FloatField(default=0.0)        # model confidence in this prediction
    predicted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vision_prediction_scores"
        ordering = ["-predicted_at"]
        indexes = [
            models.Index(fields=["student", "predicted_at"]),
            models.Index(fields=["overall_risk_level", "predicted_at"]),
        ]

    def __str__(self):
        return f"Prediction({self.student.email}) risk={self.overall_risk_level} @ {self.predicted_at.date()}"

    def compute_overall_risk(self):
        """Compute composite risk level from individual scores."""
        max_risk = max(
            self.failure_probability,
            self.dropout_risk,
            self.disengagement_risk,
        )
        if max_risk >= 0.80:
            self.overall_risk_level = "critical"
        elif max_risk >= 0.65:
            self.overall_risk_level = "high"
        elif max_risk >= 0.40:
            self.overall_risk_level = "medium"
        else:
            self.overall_risk_level = "low"
        return self.overall_risk_level


class MLModelRegistry(TimeStampedModel):
    """
    Registry of trained ML models.
    Tracks model versions, performance metrics, and file paths.
    """
    name = models.CharField(max_length=100, db_index=True)
    version = models.CharField(max_length=50)
    model_type = models.CharField(
        max_length=30,
        choices=[
            ("xgboost", "XGBoost"),
            ("random_forest", "Random Forest"),
            ("logistic", "Logistic Regression"),
        ],
    )
    file_path = models.CharField(max_length=500)
    is_active = models.BooleanField(default=False)

    # Performance metrics from evaluation
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    auc_roc = models.FloatField(null=True, blank=True)
    training_samples = models.PositiveIntegerField(default=0)
    trained_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "vision_ml_model_registry"
        unique_together = ("name", "version")
