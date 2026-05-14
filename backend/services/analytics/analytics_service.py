"""
Vision AI — Analytics Computation Service
Core business logic for computing student analytics scores.
Separated from views and tasks — pure Python, fully testable.
"""
import logging
from datetime import timedelta
from typing import Optional

from django.db import transaction
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

from core.utils import clamp, exponential_moving_average

logger = logging.getLogger(__name__)


class AnalyticsComputationService:
    """
    Computes aggregated analytics metrics from raw LearningBehaviorEvents.

    Architectural decision: all score computations use EMA (Exponential
    Moving Average) rather than simple averages. This gives more weight
    to recent behavior, which is more predictive of current ability.
    """

    def __init__(self, student_id: str):
        self.student_id = student_id

    def compute_and_update(self) -> dict:
        """
        Full analytics recomputation for a student.
        Runs in a transaction to ensure consistency.
        Returns the updated metrics dict.
        """
        from apps.analytics.models import LearningBehaviorEvent, EventType, StudentAnalytics
        from apps.students.models import StudentProfile

        try:
            student = StudentProfile.objects.get(user__id=self.student_id)
        except StudentProfile.DoesNotExist:
            logger.warning("StudentProfile not found for user %s", self.student_id)
            return {}

        # Fetch events from the last 30 days for performance
        cutoff = timezone.now() - timedelta(days=30)
        events = LearningBehaviorEvent.objects.filter(
            student_id=self.student_id,
            occurred_at__gte=cutoff,
        )

        metrics = {
            **self._compute_video_metrics(events, EventType),
            **self._compute_quiz_metrics(events, EventType),
            **self._compute_lesson_metrics(events, EventType),
            **self._compute_session_metrics(events, EventType),
        }

        # Compute derived scores
        metrics["raw_retention_score"] = self._compute_retention_score(metrics)
        metrics["raw_engagement_score"] = self._compute_engagement_score(metrics)
        metrics["raw_learning_speed_score"] = self._compute_learning_speed_score(student)
        metrics["topic_performance"] = self._compute_topic_performance(events)
        metrics["last_computed_at"] = timezone.now()

        # Upsert StudentAnalytics
        with transaction.atomic():
            StudentAnalytics.objects.update_or_create(
                student=student,
                defaults=metrics,
            )

        logger.info("Analytics updated for student %s", self.student_id)
        return metrics

    def _compute_video_metrics(self, events, EventType) -> dict:
        counts = events.filter(
            event_type__in=[
                EventType.VIDEO_START, EventType.VIDEO_COMPLETE,
                EventType.VIDEO_REWATCH, EventType.VIDEO_SKIP,
                EventType.VIDEO_PAUSE,
            ]
        ).values("event_type").annotate(count=Count("id"))

        counts_dict = {item["event_type"]: item["count"] for item in counts}
        total_watch = events.filter(
            event_type=EventType.VIDEO_COMPLETE
        ).count()

        return {
            "total_video_starts": counts_dict.get(EventType.VIDEO_START, 0),
            "total_video_completes": counts_dict.get(EventType.VIDEO_COMPLETE, 0),
            "total_rewatch_events": counts_dict.get(EventType.VIDEO_REWATCH, 0),
            "total_skip_events": counts_dict.get(EventType.VIDEO_SKIP, 0),
            "total_pause_events": counts_dict.get(EventType.VIDEO_PAUSE, 0),
        }

    def _compute_quiz_metrics(self, events, EventType) -> dict:
        quiz_events = events.filter(
            event_type__in=[EventType.QUIZ_SUBMIT, EventType.QUIZ_PASS,
                            EventType.QUIZ_FAIL, EventType.QUIZ_RETRY]
        ).values("event_type").annotate(count=Count("id"))
        counts = {item["event_type"]: item["count"] for item in quiz_events}

        total_attempts = counts.get(EventType.QUIZ_SUBMIT, 0)
        total_passes = counts.get(EventType.QUIZ_PASS, 0)

        # Average score from payload
        score_events = events.filter(event_type=EventType.QUIZ_SUBMIT)
        scores = [
            e.event_payload.get("score", 0)
            for e in score_events
            if isinstance(e.event_payload.get("score"), (int, float))
        ]
        avg_score = sum(scores) / len(scores) if scores else 0.0

        return {
            "total_quiz_attempts": total_attempts,
            "total_quiz_passes": total_passes,
            "total_quiz_retries": counts.get(EventType.QUIZ_RETRY, 0),
            "average_quiz_score": clamp(avg_score / 100.0),
        }

    def _compute_lesson_metrics(self, events, EventType) -> dict:
        counts = events.filter(
            event_type__in=[
                EventType.LESSON_START, EventType.LESSON_COMPLETE, EventType.LESSON_ABANDON
            ]
        ).values("event_type").annotate(count=Count("id"))
        counts_dict = {item["event_type"]: item["count"] for item in counts}

        started = counts_dict.get(EventType.LESSON_START, 0)
        completed = counts_dict.get(EventType.LESSON_COMPLETE, 0)
        completion_rate = (completed / started) if started > 0 else 0.0

        return {
            "total_lessons_started": started,
            "total_lessons_completed": completed,
            "total_lessons_abandoned": counts_dict.get(EventType.LESSON_ABANDON, 0),
            "lesson_completion_rate": clamp(completion_rate),
        }

    def _compute_session_metrics(self, events, EventType) -> dict:
        from apps.analytics.models import LearningSession
        sessions = LearningSession.objects.filter(
            student__user__id=self.student_id,
            started_at__gte=timezone.now() - timedelta(days=30),
        ).aggregate(
            count=Count("id"),
            avg_duration=Avg("duration_seconds"),
        )
        active_days = LearningSession.objects.filter(
            student__user__id=self.student_id
        ).dates("started_at", "day").count()

        return {
            "total_sessions": sessions["count"] or 0,
            "average_session_duration_seconds": int(sessions["avg_duration"] or 0),
            "total_active_days": active_days,
        }

    def _compute_retention_score(self, metrics: dict) -> float:
        """
        Retention = how well does the student retain material?
        Formula: weighted combination of:
        - Rewatch ratio (higher rewatches = lower retention)
        - Quiz retry rate (higher retries = lower retention)
        - Quiz pass rate (higher pass rate = higher retention)
        """
        starts = max(metrics.get("total_video_starts", 1), 1)
        rewatches = metrics.get("total_rewatch_events", 0)
        rewatch_ratio = clamp(rewatches / starts)  # High rewatch = low retention

        attempts = max(metrics.get("total_quiz_attempts", 1), 1)
        passes = metrics.get("total_quiz_passes", 0)
        pass_rate = clamp(passes / attempts)

        retries = metrics.get("total_quiz_retries", 0)
        retry_penalty = clamp(retries / attempts)

        # Weighted formula
        retention = (
            0.4 * pass_rate
            + 0.3 * (1.0 - retry_penalty)
            + 0.3 * (1.0 - rewatch_ratio * 0.5)  # Partial rewatch penalty
        )
        return clamp(retention)

    def _compute_engagement_score(self, metrics: dict) -> float:
        """
        Engagement = quality of attention during sessions.
        Formula: completion rate (40%) + session regularity (30%) + quiz participation (30%)
        """
        completion_rate = metrics.get("lesson_completion_rate", 0.0)
        active_days = metrics.get("total_active_days", 0)
        regularity = clamp(active_days / 30.0)  # Normalize to 30 days

        attempts = metrics.get("total_quiz_attempts", 0)
        starts = max(metrics.get("total_lessons_started", 1), 1)
        quiz_participation = clamp(attempts / starts)

        engagement = (
            0.4 * completion_rate
            + 0.3 * regularity
            + 0.3 * quiz_participation
        )
        return clamp(engagement)

    def _compute_learning_speed_score(self, student) -> float:
        """
        Learning speed = actual completion time vs estimated duration.
        Score > 0.5 means faster than estimated; < 0.5 means slower.
        """
        from apps.progress_tracking.models import LessonProgress
        progresses = LessonProgress.objects.filter(
            student=student,
            is_completed=True,
        ).select_related("lesson")

        if not progresses.exists():
            return 0.5  # Default: no data

        ratios = []
        for progress in progresses:
            estimated = progress.lesson.estimated_duration_minutes * 60
            actual = progress.time_spent_seconds
            if estimated > 0 and actual > 0:
                ratio = estimated / actual  # > 1 = faster, < 1 = slower
                ratios.append(clamp(ratio * 0.5))  # Normalize to [0, 1]

        return sum(ratios) / len(ratios) if ratios else 0.5

    def _compute_topic_performance(self, events) -> dict:
        """
        Build per-topic performance map from quiz events.
        Format: {"topic": {"attempts": N, "pass_rate": 0.x, "avg_score": 0.x}}
        """
        from apps.analytics.models import EventType
        quiz_events = events.filter(event_type=EventType.QUIZ_SUBMIT)

        topic_data: dict = {}
        for event in quiz_events:
            payload = event.event_payload
            topic = payload.get("topic", "general")
            score = payload.get("score", 0)
            passed = payload.get("passed", False)

            if topic not in topic_data:
                topic_data[topic] = {"attempts": 0, "passes": 0, "total_score": 0}

            topic_data[topic]["attempts"] += 1
            topic_data[topic]["passes"] += 1 if passed else 0
            topic_data[topic]["total_score"] += score

        result = {}
        for topic, data in topic_data.items():
            attempts = data["attempts"]
            result[topic] = {
                "attempts": attempts,
                "pass_rate": round(data["passes"] / attempts, 3),
                "avg_score": round(data["total_score"] / attempts, 1),
            }
        return result
