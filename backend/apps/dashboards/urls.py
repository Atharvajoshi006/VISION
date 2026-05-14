"""VISION — dashboards URL routing."""
from django.urls import path
from apps.dashboards.views import StudentDashboardOverviewView, TutorDashboardOverviewView

urlpatterns = [
    path("student/", StudentDashboardOverviewView.as_view(), name="student-dashboard"),
    path("tutor/", TutorDashboardOverviewView.as_view(), name="tutor-dashboard"),
]
