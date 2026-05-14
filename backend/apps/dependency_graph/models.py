"""
VISION Platform — Knowledge Dependency Graph Models
Concept prerequisite graph with weakness propagation.
"""
from django.db import models
from django.conf import settings
from core.models import TimeStampedModel


class StudentConceptNode(TimeStampedModel):
    """
    Per-student node in the knowledge dependency graph.
    Tracks weakness scores that propagate upstream through prerequisites.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="graph_nodes",
    )
    concept_id = models.UUIDField(db_index=True)
    concept_name = models.CharField(max_length=200)

    # Raw performance
    mastery_score = models.FloatField(default=0.0)       # 0-1 direct mastery
    weakness_score = models.FloatField(default=0.0)      # 0-1 propagated weakness
    bottleneck_score = models.FloatField(default=0.0)    # how much downstream blocking

    # Graph metadata
    depth_level = models.PositiveSmallIntegerField(default=0)  # depth in DAG
    dependent_count = models.PositiveSmallIntegerField(default=0)  # # concepts depending on this
    is_root_weakness = models.BooleanField(default=False)  # root cause weakness

    class Meta:
        db_table = "vision_student_graph_nodes"
        unique_together = ("student", "concept_id")
        indexes = [
            models.Index(fields=["student", "weakness_score"]),
            models.Index(fields=["student", "is_root_weakness"]),
        ]

    def __str__(self):
        return f"{self.student.email} → {self.concept_name} (weak={self.weakness_score:.2f})"


class GraphAnalysisResult(TimeStampedModel):
    """
    Cached result of a full dependency graph analysis for a student.
    Stores root weaknesses, bottlenecks, and suggested remediation path.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="graph_analyses",
    )
    analyzed_at = models.DateTimeField(auto_now_add=True)

    # Root weaknesses: concepts with no prerequisites that are weak
    root_weaknesses = models.JSONField(default=list)

    # Bottleneck concepts: weak concepts blocking many downstream concepts
    bottlenecks = models.JSONField(default=list)

    # Ordered remediation path (which concepts to fix first)
    remediation_path = models.JSONField(default=list)

    # Summary stats
    total_concepts_analyzed = models.PositiveIntegerField(default=0)
    weak_concepts_count = models.PositiveIntegerField(default=0)
    graph_health_score = models.FloatField(default=0.0)  # 0-1 overall knowledge health

    class Meta:
        db_table = "vision_graph_analyses"
        ordering = ["-analyzed_at"]
        get_latest_by = "analyzed_at"
