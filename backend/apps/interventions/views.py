"""
VISION Platform — Intervention Engine + Views + Tasks + URLs
"""
import logging
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from celery import shared_task
from apps.interventions.models import Intervention

logger = logging.getLogger("vision")

INTERVENTION_COOLDOWN_HOURS = 24


class InterventionEngine:
    """
    Automatically generates and delivers interventions based on risk predictions.
    Maps risk signals to specific intervention types with context-aware messaging.
    """

    def evaluate_and_trigger(self, student_id: str, prediction_id: str = None):
        """Main entry: evaluate current risk and trigger appropriate interventions."""
        from apps.predictions.models import PredictionScore
        from django.conf import settings

        if not settings.ENABLE_ADAPTIVE_INTERVENTIONS:
            return []

        # Cooldown check — don't spam interventions
        since = timezone.now() - timedelta(hours=INTERVENTION_COOLDOWN_HOURS)
        recent = Intervention.objects.filter(
            student_id=student_id,
            created_at__gte=since,
            status__in=["pending", "delivered"],
        ).count()

        max_active = settings.VISION_SETTINGS.get("MAX_ACTIVE_INTERVENTIONS", 3)
        if recent >= max_active:
            logger.info("intervention_cooldown_active", extra={"student_id": student_id})
            return []

        try:
            pred = PredictionScore.objects.filter(
                student_id=student_id
            ).latest("predicted_at")
        except PredictionScore.DoesNotExist:
            return []

        interventions_created = []
        threshold = settings.INTERVENTION_TRIGGER_THRESHOLD

        # ── Rule → Intervention Mapping ───────────────────────────────────

        if pred.failure_probability >= threshold:
            iv = self._create(
                student_id=student_id,
                iv_type="simplify_explanation",
                trigger="failure_prediction",
                title="Let's make this easier",
                message=(
                    "We noticed you're struggling with current concepts. "
                    "Vision has adjusted your learning path to use simpler explanations "
                    "and more examples. Take it one step at a time."
                ),
                trigger_score=pred.failure_probability,
                prediction_id=prediction_id,
            )
            if iv:
                interventions_created.append(iv)

        if pred.dropout_risk >= 0.70:
            iv = self._create(
                student_id=student_id,
                iv_type="motivational",
                trigger="dropout_risk",
                title="You're closer than you think",
                message=(
                    "Your consistency has slipped recently. Remember why you started. "
                    "Even 15 minutes of focused study today builds momentum. "
                    "Vision has prepared a short, high-impact revision for you."
                ),
                trigger_score=pred.dropout_risk,
                prediction_id=prediction_id,
            )
            if iv:
                interventions_created.append(iv)

        if pred.pacing_mismatch_score >= 0.65:
            iv = self._create(
                student_id=student_id,
                iv_type="slow_pacing",
                trigger="failure_prediction",
                title="Slow down — quality over speed",
                message=(
                    "You're advancing faster than your current mastery supports. "
                    "Vision is temporarily pausing new content to let you consolidate "
                    "what you've already learned."
                ),
                trigger_score=pred.pacing_mismatch_score,
                prediction_id=prediction_id,
            )
            if iv:
                interventions_created.append(iv)

        # Prerequisite injection
        from apps.dependency_graph.models import GraphAnalysisResult
        try:
            graph = GraphAnalysisResult.objects.filter(
                student_id=student_id
            ).latest()
            if graph.root_weaknesses and pred.failure_probability >= 0.5:
                top_weakness = graph.root_weaknesses[0]
                iv = self._create(
                    student_id=student_id,
                    iv_type="prerequisite_injection",
                    trigger="prerequisite_gap",
                    title=f"Build your foundation: {top_weakness.get('concept_name', '')}",
                    message=(
                        f"A weakness in '{top_weakness.get('concept_name', '')}' "
                        f"is blocking your progress on advanced topics. "
                        f"Vision has injected prerequisite review materials into your path."
                    ),
                    trigger_score=pred.failure_probability,
                    concept_id=top_weakness.get("concept_id"),
                    concept_name=top_weakness.get("concept_name", ""),
                    prediction_id=prediction_id,
                )
                if iv:
                    interventions_created.append(iv)
        except Exception:
            pass

        logger.info(
            "interventions_triggered",
            extra={"student_id": student_id, "count": len(interventions_created)},
        )
        return interventions_created

    def _create(
        self, student_id, iv_type, trigger, title, message,
        trigger_score=0.0, prediction_id=None,
        concept_id=None, concept_name="",
    ):
        """Create a single intervention if not already active of same type."""
        since = timezone.now() - timedelta(hours=INTERVENTION_COOLDOWN_HOURS)
        already_exists = Intervention.objects.filter(
            student_id=student_id,
            intervention_type=iv_type,
            created_at__gte=since,
        ).exists()
        if already_exists:
            return None

        return Intervention.objects.create(
            student_id=student_id,
            intervention_type=iv_type,
            trigger_source=trigger,
            prediction_id=prediction_id,
            trigger_score=trigger_score,
            title=title,
            message=message,
            target_concept_id=concept_id,
            target_concept_name=concept_name or "",
            status="pending",
            expires_at=timezone.now() + timedelta(days=2),
        )


# ── Serializers ──────────────────────────────────────────────────────────────
class InterventionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intervention
        fields = [
            "id", "intervention_type", "trigger_source", "trigger_score",
            "title", "message", "action_url",
            "target_concept_id", "target_concept_name",
            "status", "delivered_at", "acknowledged_at",
            "completed_at", "expires_at",
            "was_effective", "effectiveness_score",
            "created_at",
        ]
        read_only_fields = [
            "id", "trigger_source", "trigger_score",
            "delivered_at", "created_at",
        ]


# ── Views ────────────────────────────────────────────────────────────────────
class MyInterventionsView(generics.ListAPIView):
    """GET /api/v1/interventions/me/ — active interventions for student."""
    serializer_class = InterventionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Intervention.objects.filter(
            student=self.request.user,
            status__in=["pending", "delivered"],
        ).order_by("-created_at")


class AcknowledgeInterventionView(APIView):
    """POST /api/v1/interventions/<id>/acknowledge/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            iv = Intervention.objects.get(id=pk, student=request.user)
            iv.status = "acknowledged"
            iv.acknowledged_at = timezone.now()
            iv.save(update_fields=["status", "acknowledged_at"])
            return Response({"success": True})
        except Intervention.DoesNotExist:
            return Response({"success": False}, status=status.HTTP_404_NOT_FOUND)


class CompleteInterventionView(APIView):
    """POST /api/v1/interventions/<id>/complete/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            iv = Intervention.objects.get(id=pk, student=request.user)
            iv.status = "completed"
            iv.completed_at = timezone.now()
            iv.was_effective = request.data.get("was_effective", True)
            iv.save(update_fields=["status", "completed_at", "was_effective"])
            return Response({"success": True})
        except Intervention.DoesNotExist:
            return Response({"success": False}, status=status.HTTP_404_NOT_FOUND)


class InterventionHistoryView(generics.ListAPIView):
    """GET /api/v1/interventions/me/history/ — all past interventions."""
    serializer_class = InterventionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Intervention.objects.filter(student=self.request.user).order_by("-created_at")


# ── Celery Tasks ─────────────────────────────────────────────────────────────
@shared_task(name="interventions.evaluate_and_trigger_intervention", queue="interventions")
def evaluate_and_trigger_intervention(student_id: str, prediction_id: str = None):
    engine = InterventionEngine()
    engine.evaluate_and_trigger(student_id, prediction_id)


@shared_task(name="interventions.expire_old_interventions", queue="interventions")
def expire_old_interventions():
    """Mark expired interventions — runs hourly."""
    updated = Intervention.objects.filter(
        status__in=["pending", "delivered"],
        expires_at__lt=timezone.now(),
    ).update(status="expired")
    logger.info("interventions_expired", extra={"count": updated})
