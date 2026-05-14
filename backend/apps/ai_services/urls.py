"""VISION — ai_services URL routing."""
from django.urls import path
from apps.ai_services.views import GenerateExplanationView, GenerateHintView

urlpatterns = [
    path("explain/", GenerateExplanationView.as_view(), name="ai-explain"),
    path("hint/", GenerateHintView.as_view(), name="ai-hint"),
]
