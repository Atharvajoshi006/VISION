"""
VISION Platform — Adaptive Recommendation Engine
Generates personalized learning recommendations from:
- Prediction scores
- Cognitive profile
- Concept mastery
- Dependency graph analysis
- Engagement trends
"""
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger("vision")

# Difficulty adjustment rules
DIFFICULTY_RULES = {
    "high_failure": -2,       # Drop difficulty significantly
    "medium_failure": -1,     # Ease slightly
    "low_performance": -1,
    "high_performance": +1,   # Increase challenge
    "boredom_signal": +2,
}


class RecommendationEngine:
    """
    Rule-based adaptive recommendation engine.
    Generates prioritized recommendations using deterministic logic.
    Gemini is NOT used here — this is pure backend intelligence.
    """

    MAX_ACTIVE_RECOMMENDATIONS = 5

    def __init__(self, student_id: str):
        self.student_id = student_id

    def generate(self) -> list:
        """Run all recommendation rules and persist results."""
        from apps.recommendations.models import Recommendation
        from apps.predictions.models import PredictionScore
        from apps.tracking.models import ConceptMastery
        from apps.dependency_graph.models import GraphAnalysisResult
        from apps.cognitive_profiles.models import CognitiveProfile

        # Expire old recommendations
        Recommendation.objects.filter(
            student_id=self.student_id,
            is_active=True,
            expires_at__lt=timezone.now(),
        ).update(is_active=False)

        # Count current active recs
        active_count = Recommendation.objects.filter(
            student_id=self.student_id,
            is_active=True,
            is_dismissed=False,
        ).count()

        if active_count >= self.MAX_ACTIVE_RECOMMENDATIONS:
            return []

        recommendations = []

        # ── Rule 1: Prerequisite gap fix ──────────────────────────────────
        try:
            graph = GraphAnalysisResult.objects.filter(
                student_id=self.student_id
            ).latest()
            for weak in graph.root_weaknesses[:2]:
                recommendations.append(
                    self._make_recommendation(
                        rec_type="prerequisite",
                        title=f"Master prerequisite: {weak['concept_name']}",
                        description=(
                            f"Your progress on '{weak['concept_name']}' is blocking "
                            f"several advanced topics. Strengthen this foundation first."
                        ),
                        concept_id=weak["concept_id"],
                        concept_name=weak["concept_name"],
                        priority=1,
                        triggered_by="prerequisite_gap",
                    )
                )
        except Exception:
            pass

        # ── Rule 2: High failure risk → decrease difficulty ───────────────
        try:
            pred = PredictionScore.objects.filter(
                student_id=self.student_id
            ).latest("predicted_at")

            if pred.failure_probability >= 0.65:
                recommendations.append(
                    self._make_recommendation(
                        rec_type="decrease_difficulty",
                        title="Ease your learning pace",
                        description=(
                            "Our system detected high concept failure risk. "
                            "We recommend reviewing current material at a lower difficulty "
                            "before advancing."
                        ),
                        priority=2,
                        difficulty_adjustment=DIFFICULTY_RULES["high_failure"],
                        triggered_by="high_failure_risk",
                    )
                )

            if pred.dropout_risk >= 0.70:
                recommendations.append(
                    self._make_recommendation(
                        rec_type="revision",
                        title="Time for a revision session",
                        description=(
                            "Your engagement has been declining. A focused revision "
                            "of recent concepts can help rebuild momentum."
                        ),
                        priority=2,
                        triggered_by="engagement_drop",
                    )
                )
        except Exception:
            pass

        # ── Rule 3: Weak concept → targeted review ────────────────────────
        weak_concepts = ConceptMastery.objects.filter(
            student_id=self.student_id,
            mastery_score__lt=0.4,
        ).order_by("mastery_score")[:3]

        for wc in weak_concepts:
            recommendations.append(
                self._make_recommendation(
                    rec_type="concept_review",
                    title=f"Review: {wc.concept_name}",
                    description=(
                        f"Your mastery of '{wc.concept_name}' is at "
                        f"{wc.mastery_score * 100:.0f}%. Focused review will "
                        f"significantly improve your overall performance."
                    ),
                    concept_id=str(wc.concept_id),
                    concept_name=wc.concept_name,
                    priority=3,
                    triggered_by="weak_mastery",
                )
            )

        # ── Rule 4: Pacing mismatch → slow down ──────────────────────────
        try:
            if pred.pacing_mismatch_score >= 0.6:
                recommendations.append(
                    self._make_recommendation(
                        rec_type="slow_down",
                        title="Slow down and consolidate",
                        description=(
                            "You're moving faster than your current mastery level allows. "
                            "Slowing down now prevents compounding gaps later."
                        ),
                        priority=3,
                        triggered_by="pacing_mismatch",
                    )
                )
        except Exception:
            pass

        # ── Rule 5: High performer → increase difficulty ──────────────────
        avg_mastery = ConceptMastery.objects.filter(
            student_id=self.student_id
        ).aggregate(avg=__import__("django.db.models", fromlist=["Avg"]).Avg("mastery_score"))
        avg_val = avg_mastery.get("avg") or 0.0

        if avg_val > 0.85:
            recommendations.append(
                self._make_recommendation(
                    rec_type="increase_difficulty",
                    title="You're ready for a harder challenge",
                    description=(
                        "Excellent mastery across current concepts. "
                        "Increasing difficulty will accelerate your growth."
                    ),
                    priority=5,
                    difficulty_adjustment=DIFFICULTY_RULES["high_performance"],
                    triggered_by="cognitive_profile",
                )
            )

        # Persist and return
        created = []
        slots_remaining = self.MAX_ACTIVE_RECOMMENDATIONS - active_count
        for rec_data in recommendations[:slots_remaining]:
            rec = Recommendation.objects.create(
                student_id=self.student_id,
                **rec_data,
            )
            created.append(rec)

        logger.info(
            "recommendations_generated",
            extra={"student_id": self.student_id, "count": len(created)},
        )
        return created

    def _make_recommendation(
        self,
        rec_type: str,
        title: str,
        description: str,
        concept_id=None,
        concept_name="",
        priority: int = 5,
        difficulty_adjustment: int = 0,
        triggered_by: str = "",
    ) -> dict:
        return {
            "recommendation_type": rec_type,
            "title": title,
            "description": description,
            "target_concept_id": concept_id,
            "target_concept_name": concept_name,
            "priority": priority,
            "difficulty_adjustment": difficulty_adjustment,
            "triggered_by": triggered_by,
            "expires_at": timezone.now() + timedelta(days=3),
        }
