"""VISION — interventions URL routing."""
from django.urls import path
from apps.interventions.views import (
    MyInterventionsView, AcknowledgeInterventionView,
    CompleteInterventionView, InterventionHistoryView,
)

urlpatterns = [
    path("me/", MyInterventionsView.as_view(), name="my-interventions"),
    path("me/history/", InterventionHistoryView.as_view(), name="intervention-history"),
    path("<uuid:pk>/acknowledge/", AcknowledgeInterventionView.as_view(), name="intervention-acknowledge"),
    path("<uuid:pk>/complete/", CompleteInterventionView.as_view(), name="intervention-complete"),
]
