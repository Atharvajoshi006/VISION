"""
VISION Platform — Analytics Pipeline
Feature engineering + performance scoring + trend analysis.
Uses Pandas and Scikit-learn for statistical analysis.
"""
import logging
from datetime import timedelta, date
from typing import Dict, List, Optional

import numpy as np
from django.utils import timezone
from django.db.models import Avg, Count, Sum, Max, Min

logger = logging.getLogger("vision")


class AnalyticsPipeline:
    """
    Main analytics pipeline: aggregates behavioral data into structured snapshots.
    Runs daily via Celery Beat.
    """

    def run_for_student(self, student_id: str, target_date: Optional[date] = None):
        """Compute and store analytics snapshot for a student on a given date."""
        from apps.tracking.models import BehavioralEvent, LearningSession
        from apps.analytics.models import AnalyticsSnapshot

        if target_date is None:
            target_date = (timezone.now() - timedelta(days=1)).date()

        day_start = timezone.datetime.combine(target_date, timezone.datetime.min.time())
        day_end = day_start + timedelta(days=1)

        # ── Event aggregation ────────────────────────────────────────────────
        events = BehavioralEvent.objects.filter(
            student_id=student_id,
            created_at__range=(day_start, day_end),
        )

        total_events = events.count()
        if total_events == 0:
            return None  # Nothing to snapshot

        # Aggregate quiz scores
        quiz_data = events.filter(
            event_type__in=["quiz_submit", "quiz_retry"],
            score__isnull=False,
        ).aggregate(avg_score=Avg("score"), count=Count("id"))

        retry_count = events.filter(
            event_type__in=["quiz_retry", "video_replay"]
        ).count()

        hint_requests = events.filter(event_type="hint_request").count()
        inactivity_events = events.filter(event_type="inactivity").count()
        skipped = events.filter(event_type__in=["lesson_skip", "video_skip"]).count()
        lessons_done = events.filter(event_type="lesson_complete").count()
        concepts_list = list(
            events.filter(concept_id__isnull=False)
            .values_list("concept_id", flat=True)
            .distinct()
        )

        # Session data
        sessions = LearningSession.objects.filter(
            student_id=student_id,
            started_at__date=target_date,
        )
        session_count = sessions.count()
        total_study = sessions.aggregate(total=Sum("duration_seconds"))["total"] or 0

        # ── Feature engineering ──────────────────────────────────────────────
        engagement_score = self._compute_engagement_score(
            study_minutes=total_study / 60,
            event_count=total_events,
            retry_ratio=retry_count / max(total_events, 1),
            skip_ratio=skipped / max(total_events, 1),
        )

        performance_score = float(quiz_data["avg_score"] or 0.0)
        consistency_score = min(session_count / 3.0, 1.0)  # 3 sessions/day = max

        snapshot, _ = AnalyticsSnapshot.objects.update_or_create(
            student_id=student_id,
            snapshot_date=target_date,
            defaults={
                "study_time_minutes": total_study / 60,
                "session_count": session_count,
                "events_count": total_events,
                "engagement_score": engagement_score,
                "avg_quiz_score": quiz_data["avg_score"],
                "quizzes_attempted": quiz_data["count"] or 0,
                "lessons_completed": lessons_done,
                "concepts_studied": len(concepts_list),
                "retry_count": retry_count,
                "hint_requests": hint_requests,
                "inactivity_events": inactivity_events,
                "skipped_lessons": skipped,
                "performance_score": performance_score,
                "consistency_score": consistency_score,
            },
        )
        return snapshot

    def _compute_engagement_score(
        self,
        study_minutes: float,
        event_count: int,
        retry_ratio: float,
        skip_ratio: float,
    ) -> float:
        """Composite engagement score — 0 to 1."""
        # Study time component (30 min = full engagement)
        time_score = min(study_minutes / 30.0, 1.0)
        # Activity density
        activity_score = min(event_count / 50.0, 1.0)
        # Struggle penalty (retries are ok in moderation)
        struggle_penalty = min(retry_ratio * 0.3, 0.3)
        # Skip penalty
        skip_penalty = min(skip_ratio * 0.4, 0.4)

        raw = (time_score * 0.4 + activity_score * 0.6) - struggle_penalty - skip_penalty
        return max(0.0, min(1.0, raw))

    def run_for_all_students(self, target_date: Optional[date] = None):
        """Run analytics for all active students."""
        from apps.users.models import User
        count = 0
        for user in User.objects.filter(role="student", is_active=True):
            try:
                result = self.run_for_student(str(user.id), target_date)
                if result:
                    count += 1
            except Exception as exc:
                logger.error("analytics_failed_for_student", extra={
                    "student_id": str(user.id), "error": str(exc)
                })
        logger.info("analytics_run_complete", extra={"snapshots_created": count})
        return count


class EngagementTrendAnalyzer:
    """
    Computes weekly engagement trend for dropout risk detection.
    Uses linear regression slope to detect declining engagement.
    """

    def analyze_student(self, student_id: str):
        from apps.analytics.models import AnalyticsSnapshot, EngagementTrend

        # Get last 4 weeks of daily snapshots
        since = timezone.now().date() - timedelta(weeks=4)
        snapshots = list(
            AnalyticsSnapshot.objects.filter(
                student_id=student_id,
                snapshot_date__gte=since,
            ).order_by("snapshot_date").values("snapshot_date", "engagement_score")
        )

        if len(snapshots) < 3:
            return None

        # Compute linear regression slope
        x = np.arange(len(snapshots), dtype=float)
        y = np.array([s["engagement_score"] for s in snapshots])

        slope = float(np.polyfit(x, y, 1)[0])
        avg_engagement = float(np.mean(y))

        if slope < -0.02:
            direction = "down"
        elif slope > 0.02:
            direction = "up"
        else:
            direction = "stable"

        week_start = timezone.now().date() - timedelta(days=timezone.now().weekday())

        trend, _ = EngagementTrend.objects.update_or_create(
            student_id=student_id,
            week_start=week_start,
            defaults={
                "engagement_score": avg_engagement,
                "trend_direction": direction,
                "slope": slope,
            },
        )
        return trend


class FeatureEngineer:
    """
    Extracts ML features for the prediction pipeline.
    Returns a feature dict suitable for XGBoost / sklearn models.
    """

    def extract_features(self, student_id: str) -> Dict:
        """Extract all predictive features for a student."""
        from apps.tracking.models import ConceptMastery
        from apps.analytics.models import AnalyticsSnapshot, EngagementTrend
        from apps.cognitive_profiles.models import CognitiveProfile

        # Last 7 days of snapshots
        since = timezone.now().date() - timedelta(days=7)
        snapshots = AnalyticsSnapshot.objects.filter(
            student_id=student_id,
            snapshot_date__gte=since,
        )

        agg = snapshots.aggregate(
            avg_engagement=Avg("engagement_score"),
            avg_performance=Avg("performance_score"),
            avg_study_time=Avg("study_time_minutes"),
            total_retries=Sum("retry_count"),
            total_hints=Sum("hint_requests"),
            total_inactivity=Sum("inactivity_events"),
            total_skips=Sum("skipped_lessons"),
        )

        mastery = ConceptMastery.objects.filter(student_id=student_id)
        avg_mastery = mastery.aggregate(avg=Avg("mastery_score"))["avg"] or 0.0
        weak_count = mastery.filter(mastery_score__lt=0.5).count()

        try:
            profile = CognitiveProfile.objects.get(student_id=student_id)
            cognitive_features = profile.to_feature_vector()
        except Exception:
            cognitive_features = [0.5] * 10

        try:
            latest_trend = EngagementTrend.objects.filter(
                student_id=student_id
            ).latest("week_start")
            trend_slope = latest_trend.slope
            trend_dir = {"up": 1, "stable": 0, "down": -1}.get(latest_trend.trend_direction, 0)
        except Exception:
            trend_slope = 0.0
            trend_dir = 0

        return {
            # Engagement
            "avg_engagement_7d": float(agg.get("avg_engagement") or 0.0),
            "avg_performance_7d": float(agg.get("avg_performance") or 0.0),
            "avg_study_time_7d": float(agg.get("avg_study_time") or 0.0),
            # Struggle signals
            "total_retries_7d": int(agg.get("total_retries") or 0),
            "total_hints_7d": int(agg.get("total_hints") or 0),
            "total_inactivity_7d": int(agg.get("total_inactivity") or 0),
            "total_skips_7d": int(agg.get("total_skips") or 0),
            # Mastery
            "avg_mastery": float(avg_mastery),
            "weak_concept_count": int(weak_count),
            # Trend
            "engagement_trend_slope": float(trend_slope),
            "engagement_trend_direction": int(trend_dir),
            # Cognitive profile
            "logical_reasoning": cognitive_features[0],
            "pacing_requirement": cognitive_features[1],
            "retention_capability": cognitive_features[2],
            "abstraction_handling": cognitive_features[3],
            "learning_consistency": cognitive_features[4],
            "engagement_stability": cognitive_features[5],
            "struggle_tendency": cognitive_features[7],
            "recovery_speed": cognitive_features[8],
        }
