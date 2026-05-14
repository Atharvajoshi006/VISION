"""
VISION Platform — Dependency Graph Views, Serializers, URLs, Tasks
"""
from rest_framework import serializers, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from celery import shared_task
import logging

logger = logging.getLogger("vision")

# ── Serializers ──────────────────────────────────────────────────────────────
from apps.dependency_graph.models import StudentConceptNode, GraphAnalysisResult


class ConceptNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentConceptNode
        fields = [
            "concept_id", "concept_name",
            "mastery_score", "weakness_score", "bottleneck_score",
            "depth_level", "dependent_count", "is_root_weakness",
            "updated_at",
        ]


class GraphAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphAnalysisResult
        fields = [
            "id", "analyzed_at",
            "root_weaknesses", "bottlenecks", "remediation_path",
            "total_concepts_analyzed", "weak_concepts_count",
            "graph_health_score",
        ]


# ── Views ────────────────────────────────────────────────────────────────────
class MyGraphAnalysisView(APIView):
    """GET /api/v1/graph/analysis/ — latest graph analysis for current student."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            latest = GraphAnalysisResult.objects.filter(
                student=request.user
            ).latest()
            return Response({
                "success": True,
                "data": GraphAnalysisSerializer(latest).data,
            })
        except GraphAnalysisResult.DoesNotExist:
            return Response({
                "success": False,
                "message": "No graph analysis found. Trigger a refresh.",
            }, status=status.HTTP_404_NOT_FOUND)


class RefreshGraphView(APIView):
    """POST /api/v1/graph/refresh/ — trigger fresh graph analysis."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        run_graph_analysis.delay(str(request.user.id))
        return Response({"success": True, "message": "Graph analysis queued."})


class MyWeakNodesView(generics.ListAPIView):
    """GET /api/v1/graph/weak-nodes/ — weak concept nodes for current student."""
    serializer_class = ConceptNodeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentConceptNode.objects.filter(
            student=self.request.user,
            mastery_score__lt=0.5,
        ).order_by("mastery_score")


class MyRemediationPathView(APIView):
    """GET /api/v1/graph/remediation-path/ — ordered concepts to study."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            latest = GraphAnalysisResult.objects.filter(student=request.user).latest()
            return Response({
                "success": True,
                "remediation_path": latest.remediation_path,
                "graph_health_score": latest.graph_health_score,
            })
        except GraphAnalysisResult.DoesNotExist:
            return Response({"success": False, "message": "Run /graph/refresh/ first."})


# ── Celery Tasks ─────────────────────────────────────────────────────────────
@shared_task(name="dependency_graph.run_graph_analysis", queue="analytics")
def run_graph_analysis(student_id: str):
    from apps.dependency_graph.graph_engine import DependencyGraphEngine
    try:
        engine = DependencyGraphEngine(student_id=student_id)
        result = engine.analyze()
        logger.info("graph_analyzed", extra={"student_id": student_id, "weak_count": result.get("weak_count", 0)})
    except Exception as exc:
        logger.error("graph_analysis_failed", extra={"student_id": student_id, "error": str(exc)})


@shared_task(name="dependency_graph.run_all_graph_analyses", queue="analytics")
def run_all_graph_analyses():
    from apps.users.models import User
    students = User.objects.filter(role="student", is_active=True).values_list("id", flat=True)
    for sid in students:
        run_graph_analysis.apply_async(args=[str(sid)], queue="analytics")
