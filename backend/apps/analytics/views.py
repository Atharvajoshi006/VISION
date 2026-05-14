"""
VISION Platform — Analytics Views + Serializers + URLs + Tasks
"""
from rest_framework import serializers, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from celery import shared_task
import logging

logger = logging.getLogger("vision")

from apps.analytics.models import AnalyticsSnapshot, ConceptAnalytics, EngagementTrend

# ── Serializers ──────────────────────────────────────────────────────────────
class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsSnapshot
        fields = [
            "snapshot_date", "study_time_minutes", "session_count",
            "events_count", "engagement_score", "avg_quiz_score",
            "quizzes_attempted", "lessons_completed", "concepts_studied",
            "retry_count", "hint_requests", "inactivity_events",
            "skipped_lessons", "performance_score", "consistency_score",
        ]


class EngagementTrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngagementTrend
        fields = ["week_start", "engagement_score", "trend_direction", "slope"]


class ConceptAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConceptAnalytics
        fields = [
            "concept_id", "concept_name", "analyzed_date",
            "avg_mastery", "student_count", "struggling_students",
            "avg_retry_count", "avg_response_time",
        ]


# ── Views ────────────────────────────────────────────────────────────────────
class MyAnalyticsView(generics.ListAPIView):
    """GET /api/v1/analytics/me/ — student's own analytics snapshots."""
    serializer_class = AnalyticsSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        days = int(self.request.query_params.get("days", 30))
        from datetime import timedelta
        from django.utils import timezone
        since = timezone.now().date() - timedelta(days=days)
        return AnalyticsSnapshot.objects.filter(
            student=self.request.user,
            snapshot_date__gte=since,
        ).order_by("-snapshot_date")


class MyEngagementTrendView(generics.ListAPIView):
    """GET /api/v1/analytics/me/trends/ — engagement trend over time."""
    serializer_class = EngagementTrendSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EngagementTrend.objects.filter(
            student=self.request.user
        ).order_by("-week_start")[:12]


class MyFeaturesView(APIView):
    """GET /api/v1/analytics/me/features/ — raw ML features (debug/transparency)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.analytics.pipeline import FeatureEngineer
        features = FeatureEngineer().extract_features(str(request.user.id))
        return Response({"success": True, "data": features})


class ConceptHeatmapView(generics.ListAPIView):
    """GET /api/v1/analytics/heatmap/ — platform-wide concept difficulty heatmap (tutors/admin)."""
    serializer_class = ConceptAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from datetime import date
        return ConceptAnalytics.objects.filter(
            analyzed_date=date.today()
        ).order_by("avg_mastery")[:50]


class TutorCourseAnalyticsView(APIView):
    """GET /api/v1/analytics/course/<course_id>/ — tutor view of their course analytics."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        from apps.tracking.models import ConceptMastery
        from apps.courses.models import Enrollment
        from django.db.models import Avg

        enrollments = Enrollment.objects.filter(course_id=course_id, is_active=True)
        student_ids = enrollments.values_list("student_id", flat=True)

        mastery_data = ConceptMastery.objects.filter(
            student_id__in=student_ids
        ).values("concept_name").annotate(avg_mastery=Avg("mastery_score"))

        return Response({
            "success": True,
            "enrolled_count": enrollments.count(),
            "concept_mastery": list(mastery_data),
        })


# ── Celery Tasks ─────────────────────────────────────────────────────────────
@shared_task(name="analytics.run_daily_analytics", queue="analytics")
def run_daily_analytics():
    from apps.analytics.pipeline import AnalyticsPipeline
    pipeline = AnalyticsPipeline()
    count = pipeline.run_for_all_students()
    logger.info("daily_analytics_complete", extra={"snapshots": count})


@shared_task(name="analytics.run_student_analytics", queue="analytics")
def run_student_analytics(student_id: str):
    from apps.analytics.pipeline import AnalyticsPipeline
    AnalyticsPipeline().run_for_student(student_id)


@shared_task(name="analytics.compute_engagement_trends", queue="analytics")
def compute_engagement_trends():
    from apps.analytics.pipeline import EngagementTrendAnalyzer
    from apps.users.models import User
    analyzer = EngagementTrendAnalyzer()
    for user in User.objects.filter(role="student", is_active=True):
        try:
            analyzer.analyze_student(str(user.id))
        except Exception as exc:
            logger.error("trend_analysis_failed", extra={"student_id": str(user.id), "error": str(exc)})


@shared_task(name="analytics.compute_concept_heatmap", queue="analytics")
def compute_concept_heatmap():
    """Aggregate platform-wide concept analytics for tutor heatmap."""
    from apps.tracking.models import ConceptMastery
    from apps.analytics.models import ConceptAnalytics
    from django.utils import timezone
    from django.db.models import Avg, Count

    today = timezone.now().date()
    stats = (
        ConceptMastery.objects.values("concept_id", "concept_name")
        .annotate(
            avg_mastery=Avg("mastery_score"),
            student_count=Count("student", distinct=True),
            struggling_students=Count("student", filter=models.Q(mastery_score__lt=0.5)),
            avg_retry=Avg("revisit_count"),
            avg_rt=Avg("avg_response_time"),
        )
    )
    for stat in stats:
        ConceptAnalytics.objects.update_or_create(
            concept_id=stat["concept_id"],
            analyzed_date=today,
            defaults={
                "concept_name": stat["concept_name"],
                "avg_mastery": stat["avg_mastery"] or 0.0,
                "student_count": stat["student_count"],
                "struggling_students": stat["struggling_students"],
                "avg_retry_count": stat["avg_retry"] or 0.0,
                "avg_response_time": stat["avg_rt"] or 0.0,
            },
        )
