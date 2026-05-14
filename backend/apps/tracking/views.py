"""
VISION Platform — Behavioral Tracking Views
High-throughput event ingestion API endpoints.
"""
import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle

from apps.tracking.models import BehavioralEvent, LearningSession, ConceptMastery
from apps.tracking.serializers import (
    BehavioralEventIngestSerializer,
    BulkEventIngestSerializer,
    BehavioralEventSerializer,
    LearningSessionSerializer,
    ConceptMasterySerializer,
)
from core.permissions import IsStudent, IsOwnerOrAdmin
from core.pagination import LargeResultsPagination

logger = logging.getLogger("vision.tracking")


class TrackingRateThrottle(UserRateThrottle):
    """High-frequency throttle for event ingestion."""
    scope = "tracking"


class EventIngestView(APIView):
    """
    POST /api/v1/tracking/events/
    Ingest a single behavioral event.
    This is the primary real-time tracking endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TrackingRateThrottle]

    def post(self, request):
        serializer = BehavioralEventIngestSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        event = serializer.save()

        # Dispatch async processing
        from apps.tracking.tasks import process_behavioral_event
        process_behavioral_event.delay(str(event.id))

        logger.debug(
            "event_ingested",
            extra={
                "user_id": str(request.user.id),
                "event_type": event.event_type,
                "event_id": str(event.id),
            },
        )

        return Response(
            {"success": True, "event_id": str(event.id)},
            status=status.HTTP_201_CREATED,
        )


class BulkEventIngestView(APIView):
    """
    POST /api/v1/tracking/events/bulk/
    Ingest up to 50 events in one request.
    Used by video players, interactive lessons, etc.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TrackingRateThrottle]

    def post(self, request):
        serializer = BulkEventIngestSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        events_data = serializer.validated_data["events"]
        events = BehavioralEvent.objects.bulk_create([
            BehavioralEvent(
                student=request.user,
                **event_data,
            )
            for event_data in events_data
        ])

        # Batch process
        event_ids = [str(e.id) for e in events]
        from apps.tracking.tasks import process_behavioral_event_batch
        process_behavioral_event_batch.delay(event_ids)

        logger.info(
            "bulk_events_ingested",
            extra={"user_id": str(request.user.id), "count": len(events)},
        )

        return Response(
            {
                "success": True,
                "message": f"{len(events)} events ingested.",
                "event_count": len(events),
            },
            status=status.HTTP_201_CREATED,
        )


class StudentEventHistoryView(generics.ListAPIView):
    """
    GET /api/v1/tracking/events/history/
    Retrieve event history for the current student.
    """
    serializer_class = BehavioralEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LargeResultsPagination
    filterset_fields = ["event_type", "course_id", "concept_id"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return BehavioralEvent.objects.filter(
            student=self.request.user
        ).order_by("-created_at")


class ConceptMasteryView(generics.ListAPIView):
    """
    GET /api/v1/tracking/mastery/
    Get all concept mastery scores for the current student.
    """
    serializer_class = ConceptMasterySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = []
    ordering_fields = ["mastery_score", "updated_at"]

    def get_queryset(self):
        return ConceptMastery.objects.filter(
            student=self.request.user
        ).order_by("mastery_score")


class WeakConceptsView(APIView):
    """
    GET /api/v1/tracking/weak-concepts/
    Returns concepts where mastery is below threshold.
    Used by the recommendation engine.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        weak = ConceptMastery.objects.filter(
            student=request.user,
            mastery_score__lt=0.5,
        ).order_by("mastery_score")

        serializer = ConceptMasterySerializer(weak, many=True)
        return Response({
            "success": True,
            "count": weak.count(),
            "data": serializer.data,
        })


class LearningSessionListView(generics.ListAPIView):
    """
    GET /api/v1/tracking/sessions/
    List learning sessions for the current user.
    """
    serializer_class = LearningSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ["started_at", "duration_seconds"]
    ordering = ["-started_at"]

    def get_queryset(self):
        return LearningSession.objects.filter(student=self.request.user)


class AdminEventView(generics.ListAPIView):
    """
    GET /api/v1/tracking/admin/events/
    Admin: view all raw events across all students.
    """
    serializer_class = BehavioralEventSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = LargeResultsPagination
    filterset_fields = ["event_type", "student", "course_id", "is_processed"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return BehavioralEvent.objects.select_related("student").order_by("-created_at")
