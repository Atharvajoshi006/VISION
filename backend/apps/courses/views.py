from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from .models import Course, Lesson, Content
from .serializers import CourseSerializer, LessonSerializer, ContentSerializer


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/courses/
    """
    queryset = Course.objects.filter(is_active=True).prefetch_related("modules", "skills")
    serializer_class = CourseSerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/lessons/
    POST /api/lessons/<id>/start/
    POST /api/lessons/<id>/complete/
    """
    queryset = Lesson.objects.select_related("module__course").prefetch_related(
        "contents", "skills", "assessment__questions"
    )
    serializer_class = LessonSerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)

    @action(detail=True, methods=["POST"], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        lesson = self.get_object()
        # simple start: create a progress row with status=1
        from apps.progress_tracking.models import LessonProgress

        progress, created = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson,
            defaults={"status": LessonProgress.Status.IN_PROGRESS},
        )
        if not created:
            progress.status = LessonProgress.Status.IN_PROGRESS
            progress.save(update_fields=["status"])
        return Response({"detail": "Lesson started."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["POST"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        lesson = self.get_object()
        from apps.progress_tracking.models import LessonProgress

        progress, _ = LessonProgress.objects.get_or_create(user=request.user, lesson=lesson)
        progress.status = LessonProgress.Status.COMPLETED
        progress.completion_ratio = 1.0
        progress.save(update_fields=["status", "completion_ratio"])

        # Fire the mastery‑boost Celery task (see tasks)
        from apps.progress_tracking.tasks import boost_mastery_task

        boost_mastery_task.delay(request.user.id, lesson.id)

        return Response({"detail": "Lesson marked as completed."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["GET"], permission_classes=[IsAuthenticated])
    def content(self, request, pk=None):
        lesson = self.get_object()
        serializer = ContentSerializer(lesson.contents.all(), many=True)
        return Response(serializer.data)
