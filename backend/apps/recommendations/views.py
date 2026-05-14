"""
VISION Platform — Recommendations Views + Serializers + URLs + Tasks
"""
import logging
from rest_framework import serializers, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from celery import shared_task
from django.utils import timezone
from apps.recommendations.models import Recommendation

logger = logging.getLogger("vision")

# ── Serializers ──────────────────────────────────────────────────────────────
class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = [
            "id", "recommendation_type", "title", "description",
            "target_concept_id", "target_concept_name",
            "target_lesson_id", "target_course_id",
            "priority", "difficulty_adjustment", "triggered_by",
            "is_active", "is_dismissed", "acted_on",
            "acted_on_at", "expires_at", "created_at",
        ]
        read_only_fields = ["id", "created_at", "acted_on_at"]


# ── Views ────────────────────────────────────────────────────────────────────
class MyRecommendationsView(generics.ListAPIView):
    """GET /api/v1/recommendations/me/ — active recommendations for student."""
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recommendation.objects.filter(
            student=self.request.user,
            is_active=True,
            is_dismissed=False,
        ).order_by("priority", "-created_at")[:5]


class DismissRecommendationView(APIView):
    """POST /api/v1/recommendations/<id>/dismiss/ — student dismisses a recommendation."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            rec = Recommendation.objects.get(id=pk, student=request.user)
            rec.is_dismissed = True
            rec.save(update_fields=["is_dismissed"])
            return Response({"success": True, "message": "Recommendation dismissed."})
        except Recommendation.DoesNotExist:
            return Response({"success": False}, status=status.HTTP_404_NOT_FOUND)


class ActOnRecommendationView(APIView):
    """POST /api/v1/recommendations/<id>/act/ — student acts on a recommendation."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            rec = Recommendation.objects.get(id=pk, student=request.user)
            rec.acted_on = True
            rec.acted_on_at = timezone.now()
            rec.save(update_fields=["acted_on", "acted_on_at"])
            return Response({"success": True, "message": "Recommendation marked as acted on."})
        except Recommendation.DoesNotExist:
            return Response({"success": False}, status=status.HTTP_404_NOT_FOUND)


class RefreshRecommendationsView(APIView):
    """POST /api/v1/recommendations/me/refresh/ — trigger recommendation refresh."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        generate_recommendations.delay(str(request.user.id))
        return Response({"success": True, "message": "Recommendations queued for update."})


# ── Celery Tasks ─────────────────────────────────────────────────────────────
@shared_task(name="recommendations.generate_recommendations", queue="recommendations")
def generate_recommendations(student_id: str):
    from apps.recommendations.engine import RecommendationEngine
    try:
        engine = RecommendationEngine(student_id=student_id)
        recs = engine.generate()
        logger.info("recommendations_created", extra={"student_id": student_id, "count": len(recs)})
    except Exception as exc:
        logger.error("recommendation_failed", extra={"student_id": student_id, "error": str(exc)})


@shared_task(name="recommendations.generate_all_recommendations", queue="recommendations")
def generate_all_recommendations():
    from apps.users.models import User
    for user in User.objects.filter(role="student", is_active=True):
        generate_recommendations.apply_async(args=[str(user.id)], queue="recommendations")
