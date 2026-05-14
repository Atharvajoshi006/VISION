"""
VISION Platform — Course Views
"""
from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.courses.models import (
    Concept, Course, Lesson, Enrollment, Quiz, QuizAttempt, Project
)
from apps.courses.serializers import (
    ConceptSerializer, CourseListSerializer, CourseDetailSerializer,
    LessonSerializer, EnrollmentSerializer, QuizSerializer,
    QuizAttemptSerializer, ProjectSerializer,
)
from core.permissions import IsTutor, IsTutorOrAdmin, IsStudent, IsCourseTutor


class ConceptViewSet(viewsets.ModelViewSet):
    """CRUD for Concepts — Tutor/Admin only for write."""
    queryset = Concept.objects.all()
    serializer_class = ConceptSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["domain", "difficulty_level"]
    search_fields = ["name", "domain"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsTutorOrAdmin()]


class CourseViewSet(viewsets.ModelViewSet):
    """Course CRUD. Tutors create; students read."""
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["difficulty", "is_published"]
    search_fields = ["title", "description"]

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user.is_authenticated:
            return Course.objects.none()
            
        if user.role == "student":
            return Course.objects.filter(is_published=True).prefetch_related("concepts", "lessons")
        elif user.role == "tutor":
            return Course.objects.filter(tutor=user).prefetch_related("concepts", "lessons")
        return Course.objects.all().prefetch_related("concepts", "lessons")

    def get_serializer_class(self):
        if self.action == "list":
            return CourseListSerializer
        return CourseDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        if self.action == "create":
            return [IsTutor()]
        return [IsCourseTutor()]

    def perform_create(self, serializer):
        serializer.save(tutor=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsStudent])
    def enroll(self, request, pk=None):
        """POST /api/v1/courses/<id>/enroll/ — enroll current student."""
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user, course=course
        )
        if not created:
            return Response(
                {"success": False, "message": "Already enrolled."},
                status=status.HTTP_409_CONFLICT,
            )
        course.enrolled_count += 1
        course.save(update_fields=["enrolled_count"])
        return Response(
            {"success": True, "message": f"Enrolled in {course.title}.", "data": EnrollmentSerializer(enrollment).data},
            status=status.HTTP_201_CREATED,
        )


class LessonViewSet(viewsets.ModelViewSet):
    """Lesson CRUD within a course."""
    serializer_class = LessonSerializer

    def get_queryset(self):
        return Lesson.objects.filter(course_id=self.kwargs.get("course_pk"))

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsTutorOrAdmin()]


class EnrollmentListView(generics.ListAPIView):
    """GET /api/v1/courses/my-enrollments/ — student's enrollments."""
    serializer_class = EnrollmentSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return Enrollment.objects.filter(
            student=self.request.user, is_active=True
        ).select_related("course")


class QuizViewSet(viewsets.ModelViewSet):
    """Quiz CRUD."""
    serializer_class = QuizSerializer

    def get_queryset(self):
        return Quiz.objects.prefetch_related("questions")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsTutorOrAdmin()]


class QuizAttemptCreateView(generics.CreateAPIView):
    """POST /api/v1/courses/quiz-attempts/ — submit a quiz attempt."""
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsStudent]

    def perform_create(self, serializer):
        attempt = serializer.save(student=self.request.user)
        # Trigger behavioral tracking asynchronously
        from apps.tracking.tasks import process_quiz_attempt_event
        process_quiz_attempt_event.delay(str(attempt.id))


class ProjectViewSet(viewsets.ModelViewSet):
    """Project CRUD."""
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.prefetch_related("concepts")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.IsAuthenticated()]
        return [IsTutorOrAdmin()]
