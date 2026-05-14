"""
VISION Platform — Prediction Views + Serializers + URLs + Tasks
"""
import logging
from rest_framework import serializers, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from celery import shared_task

from apps.predictions.models import PredictionScore, MLModelRegistry

logger = logging.getLogger("vision.predictions")

# ── Serializers ──────────────────────────────────────────────────────────────
class PredictionScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionScore
        fields = [
            "id", "failure_probability", "dropout_risk",
            "disengagement_risk", "pacing_mismatch_score",
            "retention_decline_risk", "overall_risk_level",
            "model_version", "confidence", "predicted_at",
        ]


class MLModelRegistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MLModelRegistry
        fields = [
            "id", "name", "version", "model_type",
            "is_active", "accuracy", "precision", "recall",
            "f1_score", "auc_roc", "training_samples", "trained_at",
        ]


# ── Views ─────────────────────────────────────────────────────────────────────
class MyPredictionView(APIView):
    """GET /api/v1/predictions/me/ — latest risk prediction for current student."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            latest = PredictionScore.objects.filter(
                student=request.user
            ).latest("predicted_at")
            return Response({
                "success": True,
                "data": PredictionScoreSerializer(latest).data,
            })
        except PredictionScore.DoesNotExist:
            return Response({
                "success": False,
                "message": "No prediction available yet. Come back after more activity.",
            }, status=status.HTTP_404_NOT_FOUND)


class MyPredictionHistoryView(generics.ListAPIView):
    """GET /api/v1/predictions/me/history/ — prediction score history."""
    serializer_class = PredictionScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PredictionScore.objects.filter(
            student=self.request.user
        ).order_by("-predicted_at")[:30]


class TriggerPredictionView(APIView):
    """POST /api/v1/predictions/me/run/ — manually trigger a prediction run."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        run_failure_prediction.delay(str(request.user.id))
        return Response({"success": True, "message": "Prediction queued."})


class AdminHighRiskStudentsView(generics.ListAPIView):
    """GET /api/v1/predictions/high-risk/ — admin: students with high/critical risk."""
    serializer_class = PredictionScoreSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        risk_level = self.request.query_params.get("level", "high")
        return PredictionScore.objects.filter(
            overall_risk_level__in=["high", "critical"] if risk_level == "high"
            else [risk_level]
        ).select_related("student").order_by("-dropout_risk")


class ModelRegistryView(generics.ListAPIView):
    """GET /api/v1/predictions/models/ — admin: ML model registry."""
    serializer_class = MLModelRegistrySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = MLModelRegistry.objects.all().order_by("-trained_at")


# ── Celery Tasks ─────────────────────────────────────────────────────────────
@shared_task(
    bind=True,
    name="predictions.run_failure_prediction",
    max_retries=3,
    queue="predictions",
)
def run_failure_prediction(self, student_id: str):
    """Run all risk predictions for a student and store results."""
    from apps.predictions.ml_pipeline import PredictionEngine
    from apps.predictions.models import PredictionScore
    from django.conf import settings

    if not settings.ENABLE_ML_PREDICTIONS:
        return

    try:
        engine = PredictionEngine()
        scores = engine.predict(student_id)

        prediction = PredictionScore(
            student_id=student_id,
            failure_probability=scores["failure_probability"],
            dropout_risk=scores["dropout_risk"],
            disengagement_risk=scores["disengagement_risk"],
            pacing_mismatch_score=scores["pacing_mismatch_score"],
            retention_decline_risk=scores["retention_decline_risk"],
            feature_snapshot=scores["feature_snapshot"],
            confidence=scores["confidence"],
        )
        prediction.compute_overall_risk()
        prediction.save()

        logger.info(
            "prediction_completed",
            extra={
                "student_id": student_id,
                "risk_level": prediction.overall_risk_level,
                "failure_prob": prediction.failure_probability,
            },
        )

        # Auto-trigger intervention if high risk
        if prediction.overall_risk_level in ("high", "critical"):
            from apps.interventions.tasks import evaluate_and_trigger_intervention
            evaluate_and_trigger_intervention.apply_async(
                args=[student_id, str(prediction.id)],
                queue="interventions",
                countdown=2,
            )

    except Exception as exc:
        logger.error("prediction_failed", extra={"student_id": student_id, "error": str(exc)})
        raise self.retry(exc=exc)


@shared_task(name="predictions.run_all_predictions", queue="predictions")
def run_all_predictions():
    """Nightly: run predictions for all active students."""
    from apps.users.models import User
    students = User.objects.filter(role="student", is_active=True).values_list("id", flat=True)
    for sid in students:
        run_failure_prediction.apply_async(args=[str(sid)], queue="predictions", countdown=0)
    logger.info("all_predictions_queued", extra={"count": len(students)})


@shared_task(name="predictions.train_models", queue="predictions")
def train_models():
    """Weekly: retrain ML models on accumulated data."""
    from apps.predictions.ml_pipeline import ModelTrainer
    trainer = ModelTrainer()
    trainer.train_failure_model()
    logger.info("model_training_complete")
