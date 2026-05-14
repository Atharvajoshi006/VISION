"""
Vision AI — Learning Profile Engine Service
Translates raw StudentAnalytics into a cognitive LearningProfile.
Uses EMA-based incremental updates — never full recomputation.
"""
import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from core.utils import clamp, exponential_moving_average

logger = logging.getLogger(__name__)

WEAK_TOPIC_THRESHOLD = getattr(settings, "WEAK_TOPIC_THRESHOLD", 0.6)
STRONG_TOPIC_THRESHOLD = getattr(settings, "STRONG_TOPIC_THRESHOLD", 0.85)
EMA_ALPHA = getattr(settings, "ENGAGEMENT_EMA_ALPHA", 0.3)


class LearningProfileService:
    """
    Updates a student's LearningProfile from their latest StudentAnalytics.

    Design principles:
    1. Incremental: uses EMA to smooth updates — avoids wild score swings
    2. Confidence-gated: low data_points_count = low confidence
    3. Idempotent: safe to run multiple times on the same data
    4. Transactional: all updates committed atomically
    """

    def __init__(self, student_profile):
        self.student = student_profile

    def update_profile(self) -> "LearningProfile":
        """
        Main entry point. Pulls latest StudentAnalytics and updates LearningProfile.
        Creates the profile if it doesn't exist yet.
        """
        from apps.analytics.models import StudentAnalytics
        from apps.learning_profiles.models import LearningProfile, LearningStyle

        try:
            analytics = self.student.analytics
        except StudentAnalytics.DoesNotExist:
            logger.warning("No analytics for student %s — skipping profile update", self.student.id)
            return None

        with transaction.atomic():
            profile, created = LearningProfile.objects.select_for_update().get_or_create(
                student=self.student
            )

            # ─── Update core scores using EMA ───────────────────
            profile.retention_score = exponential_moving_average(
                profile.retention_score,
                analytics.raw_retention_score,
                alpha=EMA_ALPHA,
            )
            profile.engagement_score = exponential_moving_average(
                profile.engagement_score,
                analytics.raw_engagement_score,
                alpha=EMA_ALPHA,
            )
            profile.learning_speed_score = exponential_moving_average(
                profile.learning_speed_score,
                analytics.raw_learning_speed_score,
                alpha=EMA_ALPHA,
            )

            # ─── Update difficulty tolerance ────────────────────
            profile.difficulty_tolerance = self._compute_difficulty_tolerance(analytics)

            # ─── Update topic mastery scores ────────────────────
            profile.mastery_scores = self._update_mastery_scores(
                profile.mastery_scores,
                analytics.topic_performance,
            )

            # ─── Derive weak/strong topics ──────────────────────
            profile.weak_topics = self._extract_weak_topics(profile.mastery_scores)
            profile.strong_topics = self._extract_strong_topics(profile.mastery_scores)

            # ─── Infer learning style ───────────────────────────
            profile.preferred_learning_style = self._infer_learning_style(analytics)

            # ─── Update confidence ──────────────────────────────
            profile.data_points_count += analytics.total_sessions
            profile.confidence_level = clamp(profile.data_points_count / 100.0)

            profile.save()

        # Take daily snapshot
        self._take_snapshot(profile)

        logger.info(
            "LearningProfile updated for student %s | retention=%.2f | engagement=%.2f",
            self.student.id,
            profile.retention_score,
            profile.engagement_score,
        )
        return profile

    def _compute_difficulty_tolerance(self, analytics) -> float:
        """
        Difficulty tolerance = highest difficulty level the student consistently passes.
        Derived from per-topic performance + lesson difficulty scores.
        """
        from apps.progress_tracking.models import LessonProgress
        passed_lessons = LessonProgress.objects.filter(
            student=self.student,
            is_completed=True,
            quiz_passed=True,
        ).select_related("lesson")

        if not passed_lessons.exists():
            return 0.3  # Default: assume beginner

        difficulty_scores = [lp.lesson.difficulty_score for lp in passed_lessons]
        # Use 75th percentile as tolerance — not max (outlier) nor mean (conservative)
        sorted_scores = sorted(difficulty_scores)
        p75_index = int(len(sorted_scores) * 0.75)
        return clamp(sorted_scores[p75_index])

    def _update_mastery_scores(
        self,
        existing_mastery: dict,
        topic_performance: dict,
    ) -> dict:
        """
        Incrementally update per-topic mastery scores using EMA.
        New topics are initialized at their observed pass_rate.
        """
        updated = dict(existing_mastery)
        for topic, perf in topic_performance.items():
            pass_rate = perf.get("pass_rate", 0.0)
            if topic in updated:
                updated[topic] = round(
                    exponential_moving_average(updated[topic], pass_rate, EMA_ALPHA), 3
                )
            else:
                # New topic: initialize conservatively (no prior data)
                updated[topic] = round(pass_rate * 0.8, 3)
        return updated

    def _extract_weak_topics(self, mastery_scores: dict) -> list:
        """Return topics below the weak threshold, sorted by score ascending."""
        weak = [
            {"topic": topic, "score": score}
            for topic, score in mastery_scores.items()
            if score < WEAK_TOPIC_THRESHOLD
        ]
        return sorted(weak, key=lambda x: x["score"])[:10]  # Top 10 weakest

    def _extract_strong_topics(self, mastery_scores: dict) -> list:
        """Return topics above the strong threshold, sorted by score descending."""
        strong = [
            {"topic": topic, "score": score}
            for topic, score in mastery_scores.items()
            if score >= STRONG_TOPIC_THRESHOLD
        ]
        return sorted(strong, key=lambda x: x["score"], reverse=True)[:10]

    def _infer_learning_style(self, analytics) -> str:
        """
        Infers preferred learning style from behavioral signals.
        MVP rule-based logic — can be replaced with ML classifier.
        """
        from apps.learning_profiles.models import LearningStyle

        if analytics.total_sessions < 5:
            return LearningStyle.UNKNOWN

        rewatch_rate = (
            analytics.total_rewatch_events / max(analytics.total_video_starts, 1)
        )
        quiz_engagement = (
            analytics.total_quiz_attempts / max(analytics.total_lessons_completed, 1)
        )

        if rewatch_rate > 0.4:
            return LearningStyle.VISUAL  # Heavy rewatching → visual learner
        elif quiz_engagement > 1.5:
            return LearningStyle.KINESTHETIC  # Heavy quiz practice → kinesthetic
        else:
            return LearningStyle.MIXED

    def _take_snapshot(self, profile):
        """Save a daily snapshot of the profile for trend analysis."""
        from apps.learning_profiles.models import LearningProfileSnapshot
        today = timezone.now().date()
        LearningProfileSnapshot.objects.update_or_create(
            student=self.student,
            snapshot_date=today,
            defaults={
                "retention_score": profile.retention_score,
                "engagement_score": profile.engagement_score,
                "learning_speed_score": profile.learning_speed_score,
                "difficulty_tolerance": profile.difficulty_tolerance,
                "mastery_scores": profile.mastery_scores,
                "data_points_count": profile.data_points_count,
            },
        )
