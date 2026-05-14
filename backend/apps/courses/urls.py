"""VISION — courses URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.courses import views

router = DefaultRouter()
router.register("concepts", views.ConceptViewSet, basename="concept")
router.register("", views.CourseViewSet, basename="course")
router.register("quizzes", views.QuizViewSet, basename="quiz")
router.register("projects", views.ProjectViewSet, basename="project")

urlpatterns = [
    path("my-enrollments/", views.EnrollmentListView.as_view(), name="my-enrollments"),
    path("quiz-attempts/", views.QuizAttemptCreateView.as_view(), name="quiz-attempt-create"),
    path("", include(router.urls)),
]
