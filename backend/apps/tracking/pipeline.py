"""
VISION Platform — Behavioral Event Processing Pipeline
Core intelligence processing: event → mastery → analytics → prediction triggers.
"""
import logging
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg, Count, Sum

logger = logging.getLogger("vision.tracking")


class EventProcessor:
    """
    Processes individual behavioral events.
    Updates mastery scores, session data, and triggers downstream intelligence.
    """

    # Events that directly affect concept mastery
    MASTERY_EVENTS = {
        "quiz_submit", "quiz_retry", "question_answer",
        "concept_revisit", "lesson_complete",
    }

    # Events signaling potential struggle
    STRUGGLE_EVENTS = {
        "quiz_retry", "quiz_abandon", "hint_request",
        "video_replay", "concept_revisit",
    }

    def process(self, event):
        """Main processing entry point for a single event."""
        from apps.tracking.models import BehavioralEvent

        with transaction.atomic():
            if event.event_type in self.MASTERY_EVENTS and event.concept_id:
                self._update_concept_mastery(event)

            self._update_session(event)

            # Mark as processed
            BehavioralEvent.objects.filter(id=event.id).update(
                is_processed=True,
                processed_at=timezone.now(),
            )

        # Trigger downstream intelligence (outside transaction)
        self._maybe_trigger_prediction(event)

    def _update_concept_mastery(self, event):
        """Update rolling mastery score for the concept in this event."""
        from apps.tracking.models import ConceptMastery

        mastery, _ = ConceptMastery.objects.get_or_create(
            student=event.student,
            concept_id=event.concept_id,
            defaults={"concept_name": event.concept_name},
        )

        # Update raw stats
        mastery.total_attempts += 1

        if event.score is not None:
            if event.score >= 0.7:
                mastery.correct_attempts += 1

            # Exponential moving average for mastery score
            alpha = 0.3  # smoothing factor
            mastery.mastery_score = (
                alpha * event.score + (1 - alpha) * mastery.mastery_score
            )

        if event.event_type == "concept_revisit":
            mastery.revisit_count += 1

        if event.response_time_seconds:
            # Weighted average response time
            n = mastery.total_attempts
            mastery.avg_response_time = (
                (mastery.avg_response_time * (n - 1) + event.response_time_seconds) / n
            )

        mastery.last_reviewed_at = timezone.now()
        mastery.save(update_fields=[
            "mastery_score", "total_attempts", "correct_attempts",
            "avg_response_time", "revisit_count", "last_reviewed_at",
        ])

    def _update_session(self, event):
        """Update or create a learning session record."""
        from apps.tracking.models import LearningSession

        if not event.session_id:
            return

        session, created = LearningSession.objects.get_or_create(
            session_id=event.session_id,
            defaults={
                "student": event.student,
                "started_at": event.created_at,
            },
        )

        updates = {"event_count": session.event_count + 1}

        if event.course_id:
            courses = set(session.courses_accessed)
            courses.add(str(event.course_id))
            updates["courses_accessed"] = list(courses)

        if event.concept_id:
            concepts = set(session.concepts_studied)
            concepts.add(str(event.concept_id))
            updates["concepts_studied"] = list(concepts)

        updates["ended_at"] = event.created_at

        for key, value in updates.items():
            setattr(session, key, value)
        session.save()

    def _maybe_trigger_prediction(self, event):
        """
        Trigger failure prediction if struggle signals accumulate.
        Fires when: multiple retries, high response time, or inactivity detected.
        """
        TRIGGER_EVENTS = {"quiz_retry", "inactivity", "quiz_abandon"}
        if event.event_type in TRIGGER_EVENTS:
            from apps.predictions.tasks import run_failure_prediction
            run_failure_prediction.apply_async(
                args=[str(event.student.id)],
                countdown=5,  # small delay to batch rapid events
                queue="predictions",
            )


class MasteryCalculator:
    """
    Full mastery recalculation for a student across all concepts.
    Uses historical behavioral events for a more accurate batch calculation.
    """

    def __init__(self, student_id: str):
        self.student_id = student_id

    def recalculate_all(self):
        """Recalculate mastery for all concepts this student has interacted with."""
        from apps.tracking.models import BehavioralEvent, ConceptMastery

        # Get all concepts this student has attempted
        concept_stats = (
            BehavioralEvent.objects.filter(
                student_id=self.student_id,
                concept_id__isnull=False,
                score__isnull=False,
            )
            .values("concept_id", "concept_name")
            .annotate(
                avg_score=Avg("score"),
                attempt_count=Count("id"),
                total_time=Sum("response_time_seconds"),
            )
        )

        for stat in concept_stats:
            ConceptMastery.objects.update_or_create(
                student_id=self.student_id,
                concept_id=stat["concept_id"],
                defaults={
                    "concept_name": stat["concept_name"] or "",
                    "mastery_score": min(stat["avg_score"], 1.0),
                    "total_attempts": stat["attempt_count"],
                    "avg_response_time": (
                        stat["total_time"] / stat["attempt_count"]
                        if stat["total_time"] and stat["attempt_count"]
                        else 0.0
                    ),
                },
            )


class SessionAggregator:
    """
    Nightly job: aggregates events into LearningSession records.
    """

    def aggregate_yesterday(self) -> int:
        """Aggregate all unprocessed sessions from yesterday."""
        from apps.tracking.models import BehavioralEvent, LearningSession

        yesterday_start = (timezone.now() - timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        yesterday_end = yesterday_start + timedelta(days=1)

        sessions_created = 0
        # Group events by student + session_id
        session_groups = (
            BehavioralEvent.objects.filter(
                created_at__range=(yesterday_start, yesterday_end),
                session_id__gt="",
            )
            .values("student_id", "session_id")
            .annotate(
                event_count=Count("id"),
                total_watch=Sum("watch_time_seconds"),
            )
        )

        for group in session_groups:
            events = BehavioralEvent.objects.filter(
                student_id=group["student_id"],
                session_id=group["session_id"],
                created_at__range=(yesterday_start, yesterday_end),
            ).order_by("created_at")

            if not events.exists():
                continue

            first = events.first()
            last = events.last()
            duration = (last.created_at - first.created_at).total_seconds()

            _, created = LearningSession.objects.update_or_create(
                session_id=group["session_id"],
                defaults={
                    "student_id": group["student_id"],
                    "started_at": first.created_at,
                    "ended_at": last.created_at,
                    "duration_seconds": int(duration),
                    "event_count": group["event_count"],
                    "engagement_score": min(duration / 3600, 1.0),  # 1hr = max engagement
                },
            )
            if created:
                sessions_created += 1

        return sessions_created
