"""VISION — predictions URL routing."""
from django.urls import path
from apps.predictions.views import (
    MyPredictionView, MyPredictionHistoryView, TriggerPredictionView,
    AdminHighRiskStudentsView, ModelRegistryView,
)

urlpatterns = [
    path("me/", MyPredictionView.as_view(), name="my-prediction"),
    path("me/history/", MyPredictionHistoryView.as_view(), name="prediction-history"),
    path("me/run/", TriggerPredictionView.as_view(), name="trigger-prediction"),
    path("high-risk/", AdminHighRiskStudentsView.as_view(), name="high-risk-students"),
    path("models/", ModelRegistryView.as_view(), name="model-registry"),
]
