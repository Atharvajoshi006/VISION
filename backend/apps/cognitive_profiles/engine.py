"""
VISION Platform — Cognitive Profiling Engine
Derives cognitive indicators from behavioral signals using statistical analysis.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, StdDev, Sum

logger = logging.getLogger("vision")


class CognitiveProfileEngine:
    """
    Derives and updates cognitive profile indicators from behavioral data.
    Uses rule-based statistical analysis (deterministic, not ML-based).
    """

    MIN_EVENTS = 10  # Minimum events before profile is meaningful

    def __init__(self, student_id: str):
        self.student_id = student_id

    def recalculate(self) -> "CognitiveProfile":
        """Full profile recalculation from behavioral history."""
        from apps.cognitive_profiles.models import CognitiveProfile
        from apps.tracking.models import BehavioralEvent, ConceptMastery

        profile, _ = CognitiveProfile.objects.get_or_create(student_id=self.student_id)

        # Pull last 30 days of events
        since = timezone.now() - timedelta(days=30)
        events = BehavioralEvent.objects.filter(
            student_id=self.student_id,
            created_at__gte=since,
        )
        event_count = events.count()

        if event_count < self.MIN_EVENTS:
            profile.confidence_score = event_count / self.MIN_EVENTS
            profile.total_events_analyzed = event_count
            profile.save()
            return profile

        # ── Calculate each cognitive indicator ──────────────────────────────

        # 1. Logical Reasoning Strength → avg quiz score on logic-type questions
        quiz_events = events.filter(
            event_type__in=["quiz_submit", "question_answer"],
            score__isnull=False,
        )
        avg_score = quiz_events.aggregate(avg=Avg("score"))["avg"] or 0.5
        profile.logical_reasoning_strength = min(avg_score, 1.0)

        # 2. Pacing Requirement → response time relative to concept difficulty
        response_times = events.filter(response_time_seconds__isnull=False)
        avg_rt = response_times.aggregate(avg=Avg("response_time_seconds"))["avg"] or 30
        # Normalize: >120s = high pacing need (1.0), <10s = low (0.0)
        profile.pacing_requirement = min(avg_rt / 120.0, 1.0)

        # 3. Retention Capability → mastery score trends
        masteries = ConceptMastery.objects.filter(student_id=self.student_id)
        avg_mastery = masteries.aggregate(avg=Avg("mastery_score"))["avg"] or 0.5
        profile.retention_capability = avg_mastery

        # 4. Abstraction Handling → performance on high-difficulty concepts
        high_diff_events = events.filter(
            metadata__difficulty__gte=7,
            score__isnull=False,
        )
        abs_score = high_diff_events.aggregate(avg=Avg("score"))["avg"]
        profile.abstraction_handling = abs_score if abs_score is not None else 0.5

        # 5. Learning Consistency → study frequency (days with activity / 30)
        active_days = (
            events.dates("created_at", "day").count()
        )
        profile.learning_consistency = min(active_days / 30.0, 1.0)

        # 6. Engagement Stability → stddev of daily event counts (lower stddev = more stable)
        retry_events = events.filter(
            event_type__in=["quiz_retry", "video_replay", "concept_revisit"]
        ).count()
        retry_ratio = retry_events / max(event_count, 1)
        profile.struggle_tendency = min(retry_ratio, 1.0)

        # 7. Engagement Stability → based on session consistency
        from apps.tracking.models import LearningSession
        sessions = LearningSession.objects.filter(
            student_id=self.student_id,
            started_at__gte=since,
        )
        session_count = sessions.count()
        profile.engagement_stability = min(session_count / 20.0, 1.0)  # 20 sessions = max

        # 8. Visual Tendency → ratio of video events to text/quiz events
        video_events = events.filter(
            event_type__in=["video_play", "video_complete", "video_replay"]
        ).count()
        text_events = events.filter(
            event_type__in=["content_view", "quiz_submit"]
        ).count()
        total_typed = video_events + text_events
        profile.visual_tendency = (video_events / total_typed) if total_typed > 0 else 0.5

        # 9. Recovery Speed → how quickly performance improves after a bad quiz
        retry_scores = quiz_events.filter(attempt_number__gt=1).aggregate(avg=Avg("score"))
        profile.recovery_speed = retry_scores["avg"] if retry_scores["avg"] else 0.5

        # Profile health
        profile.confidence_score = min(event_count / 100.0, 1.0)  # 100 events = full confidence
        profile.total_events_analyzed = event_count
        profile.last_recalculated_at = timezone.now()
        profile.profile_version += 1

        profile.save()

        # Store daily snapshot
        self._save_snapshot(profile)
        logger.info(
            "cognitive_profile_updated",
            extra={
                "student_id": self.student_id,
                "version": profile.profile_version,
                "confidence": profile.confidence_score,
            },
        )
        return profile

    def _save_snapshot(self, profile):
        """Store daily snapshot for historical tracking."""
        from apps.cognitive_profiles.models import ProfileSnapshot

        today = timezone.now().date()
        ProfileSnapshot.objects.update_or_create(
            profile=profile,
            snapshot_date=today,
            defaults={
                "overall_score": profile.overall_score,
                "indicators": {
                    "logical_reasoning_strength": profile.logical_reasoning_strength,
                    "pacing_requirement": profile.pacing_requirement,
                    "retention_capability": profile.retention_capability,
                    "abstraction_handling": profile.abstraction_handling,
                    "learning_consistency": profile.learning_consistency,
                    "engagement_stability": profile.engagement_stability,
                    "visual_tendency": profile.visual_tendency,
                    "struggle_tendency": profile.struggle_tendency,
                    "recovery_speed": profile.recovery_speed,
                },
            },
        )
