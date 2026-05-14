from django.urls import path
from apps.assessments.views import AssessmentDetailView, QuizAttemptView

app_name = "assessments"
urlpatterns = [
    path("<uuid:pk>/",          AssessmentDetailView.as_view(), name="assessment-detail"),
    path("<uuid:pk>/attempt/",  QuizAttemptView.as_view(),      name="quiz-attempt"),
]
