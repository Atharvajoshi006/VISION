"""
VISION Platform — Knowledge Dependency Graph Engine
Implements DAG traversal, weakness propagation, and bottleneck detection.
Uses NetworkX for graph operations.
"""
import logging
from collections import defaultdict
from typing import Dict, List, Tuple

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False

from core.utils import clamp

logger = logging.getLogger("vision")


class DependencyGraphEngine:
    """
    Builds and analyzes the knowledge dependency graph for a student.

    Example graph:
        Algebra → Functions → Recursion → Trees → Graphs

    Core operations:
    1. Build DAG from ConceptPrerequisite edges
    2. Overlay student mastery scores on nodes
    3. Propagate weakness upstream (weak Recursion → flag Functions review)
    4. Identify bottlenecks (concepts blocking many downstream concepts)
    5. Produce ordered remediation path (topological sort of weak nodes)
    """

    def __init__(self, student_id: str):
        self.student_id = student_id
        self.graph = nx.DiGraph() if NETWORKX_AVAILABLE else None

    def analyze(self) -> Dict:
        """
        Full graph analysis for the student.
        Returns: {root_weaknesses, bottlenecks, remediation_path, health_score}
        """
        from apps.courses.models import ConceptPrerequisite
        from apps.tracking.models import ConceptMastery

        # ── 1. Build the concept DAG ────────────────────────────────────────
        prereqs = ConceptPrerequisite.objects.select_related(
            "concept", "prerequisite"
        ).all()

        mastery_map = {
            str(m.concept_id): m.mastery_score
            for m in ConceptMastery.objects.filter(student_id=self.student_id)
        }

        if NETWORKX_AVAILABLE:
            return self._analyze_with_networkx(prereqs, mastery_map)
        else:
            return self._analyze_fallback(prereqs, mastery_map)

    def _analyze_with_networkx(self, prereqs, mastery_map: Dict) -> Dict:
        """Full NetworkX-based graph analysis."""
        G = nx.DiGraph()

        # Add edges: prerequisite → concept (directed dependency)
        for edge in prereqs:
            pre_id = str(edge.prerequisite.id)
            con_id = str(edge.concept.id)
            G.add_edge(pre_id, con_id, weight=edge.strength)

            # Annotate nodes with concept names and mastery
            G.nodes[pre_id]["name"] = edge.prerequisite.name
            G.nodes[pre_id]["mastery"] = mastery_map.get(pre_id, 0.0)
            G.nodes[con_id]["name"] = edge.concept.name
            G.nodes[con_id]["mastery"] = mastery_map.get(con_id, 0.0)

        if G.number_of_nodes() == 0:
            return self._empty_result()

        # ── 2. Propagate weakness scores ────────────────────────────────────
        weakness_map = self._propagate_weakness(G, mastery_map)

        # ── 3. Identify root weaknesses (weak nodes with no prerequisites) ──
        root_weaknesses = [
            {
                "concept_id": node,
                "concept_name": G.nodes[node].get("name", ""),
                "mastery_score": mastery_map.get(node, 0.0),
                "weakness_score": weakness_map.get(node, 0.0),
            }
            for node in G.nodes
            if G.in_degree(node) == 0 and mastery_map.get(node, 0.0) < 0.5
        ]

        # ── 4. Bottleneck detection ─────────────────────────────────────────
        # A bottleneck is a weak node with high out-degree (blocks many concepts)
        bottlenecks = sorted([
            {
                "concept_id": node,
                "concept_name": G.nodes[node].get("name", ""),
                "mastery_score": mastery_map.get(node, 0.0),
                "dependent_count": G.out_degree(node),
                "bottleneck_score": (1 - mastery_map.get(node, 0.0)) * G.out_degree(node),
            }
            for node in G.nodes
            if mastery_map.get(node, 0.0) < 0.5 and G.out_degree(node) > 0
        ], key=lambda x: -x["bottleneck_score"])[:10]

        # ── 5. Remediation path (topological order of weak concepts) ────────
        weak_nodes = [n for n in G.nodes if mastery_map.get(n, 0.0) < 0.5]
        weak_subgraph = G.subgraph(weak_nodes)
        try:
            topo_order = list(nx.topological_sort(weak_subgraph))
            remediation_path = [
                {
                    "concept_id": node,
                    "concept_name": G.nodes[node].get("name", ""),
                    "mastery_score": mastery_map.get(node, 0.0),
                }
                for node in topo_order
            ]
        except nx.NetworkXUnfeasible:
            remediation_path = []

        # ── 6. Graph health score ────────────────────────────────────────────
        all_masteries = [mastery_map.get(n, 0.0) for n in G.nodes]
        health_score = sum(all_masteries) / len(all_masteries) if all_masteries else 0.0

        result = {
            "root_weaknesses": root_weaknesses,
            "bottlenecks": bottlenecks,
            "remediation_path": remediation_path,
            "total_concepts": G.number_of_nodes(),
            "weak_count": len(weak_nodes),
            "graph_health_score": health_score,
        }

        # Persist results
        self._save_result(result)
        # Update per-node scores
        self._update_node_scores(G, mastery_map, weakness_map, bottlenecks)

        return result

    def _propagate_weakness(self, G, mastery_map: Dict) -> Dict:
        """
        Propagate weakness scores upstream.
        If Recursion is weak, Functions should have elevated weakness score
        because students may struggle with Recursion due to weak Functions.
        """
        weakness = {node: 1 - mastery_map.get(node, 0.0) for node in G.nodes}

        # Propagate: for each node, add fraction of successor weaknesses
        for node in nx.topological_sort(G):
            for successor in G.successors(node):
                edge_weight = G[node][successor].get("weight", 1.0)
                weakness[node] += 0.3 * weakness[successor] * edge_weight

        # Normalize
        max_weakness = max(weakness.values()) if weakness else 1
        return {k: clamp(v / max(max_weakness, 1)) for k, v in weakness.items()}

    def _analyze_fallback(self, prereqs, mastery_map: Dict) -> Dict:
        """Fallback without NetworkX — simple adjacency-list analysis."""
        graph = defaultdict(list)
        all_concepts = {}

        for edge in prereqs:
            pre_id = str(edge.prerequisite.id)
            con_id = str(edge.concept.id)
            graph[pre_id].append(con_id)
            all_concepts[pre_id] = edge.prerequisite.name
            all_concepts[con_id] = edge.concept.name

        weak_nodes = [
            {"concept_id": cid, "concept_name": name,
             "mastery_score": mastery_map.get(cid, 0.0)}
            for cid, name in all_concepts.items()
            if mastery_map.get(cid, 0.0) < 0.5
        ]

        health = (sum(mastery_map.values()) / len(mastery_map)) if mastery_map else 0.0

        return {
            "root_weaknesses": weak_nodes[:5],
            "bottlenecks": [],
            "remediation_path": weak_nodes,
            "total_concepts": len(all_concepts),
            "weak_count": len(weak_nodes),
            "graph_health_score": health,
        }

    def _save_result(self, result: Dict):
        from apps.dependency_graph.models import GraphAnalysisResult
        GraphAnalysisResult.objects.create(
            student_id=self.student_id,
            root_weaknesses=result["root_weaknesses"],
            bottlenecks=result["bottlenecks"],
            remediation_path=result["remediation_path"],
            total_concepts_analyzed=result["total_concepts"],
            weak_concepts_count=result["weak_count"],
            graph_health_score=result["graph_health_score"],
        )

    def _update_node_scores(self, G, mastery_map, weakness_map, bottlenecks):
        from apps.dependency_graph.models import StudentConceptNode
        bottleneck_ids = {b["concept_id"] for b in bottlenecks}

        for node in G.nodes:
            StudentConceptNode.objects.update_or_create(
                student_id=self.student_id,
                concept_id=node,
                defaults={
                    "concept_name": G.nodes[node].get("name", ""),
                    "mastery_score": mastery_map.get(node, 0.0),
                    "weakness_score": weakness_map.get(node, 0.0),
                    "bottleneck_score": next(
                        (b["bottleneck_score"] for b in bottlenecks if b["concept_id"] == node), 0.0
                    ),
                    "depth_level": 0,  # could compute via nx.shortest_path_length
                    "dependent_count": G.out_degree(node),
                    "is_root_weakness": G.in_degree(node) == 0 and mastery_map.get(node, 0.0) < 0.5,
                },
            )

    def _empty_result(self) -> Dict:
        return {
            "root_weaknesses": [],
            "bottlenecks": [],
            "remediation_path": [],
            "total_concepts": 0,
            "weak_count": 0,
            "graph_health_score": 1.0,
        }
