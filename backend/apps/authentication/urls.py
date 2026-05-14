"""VISION — Authentication URL routing."""
from django.urls import path
from apps.authentication import views

urlpatterns = [
    path("status/", views.AuthStatusView.as_view(), name="auth-status"),
]
