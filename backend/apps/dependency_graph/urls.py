"""VISION — dependency_graph URL routing."""
from django.urls import path
from apps.dependency_graph.views import (
    MyGraphAnalysisView, RefreshGraphView,
    MyWeakNodesView, MyRemediationPathView,
)

urlpatterns = [
    path("analysis/", MyGraphAnalysisView.as_view(), name="graph-analysis"),
    path("refresh/", RefreshGraphView.as_view(), name="graph-refresh"),
    path("weak-nodes/", MyWeakNodesView.as_view(), name="graph-weak-nodes"),
    path("remediation-path/", MyRemediationPathView.as_view(), name="graph-remediation"),
]
