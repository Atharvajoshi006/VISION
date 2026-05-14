"""
VISION Platform — Behavioral Tracking Celery Tasks
The event processing pipeline: ingest → aggregate → trigger downstream intelligence.
"""
import logging
from datetime import datetime, timedelta
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("vision.tracking")


@shared_task(
    bind=True,
    name="tracking.process_behavioral_event",
    max_retries=3,
    default_retry_delay=10,
    queue="tracking",
)
def process_behavioral_event(self, event_id: str):
    """
    Process a single behavioral event.
    1. Mark event as processed
    2. Update ConceptMastery rolling scores
    3. Update LearningSession aggregation
    4. Trigger downstream analytics if thresholds are met
    """
    from apps.tracking.models import BehavioralEvent
    from apps.tracking.pipeline import EventProcessor

    try:
        event = BehavioralEvent.objects.select_related("student").get(id=event_id)
        processor = EventProcessor()
        processor.process(event)

        logger.info(
            "event_processed",
            extra={"event_id": event_id, "event_type": event.event_type},
        )
    except BehavioralEvent.DoesNotExist:
        logger.warning("event_not_found", extra={"event_id": event_id})
    except Exception as exc:
        logger.error("event_processing_failed", extra={"event_id": event_id, "error": str(exc)})
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name="tracking.process_behavioral_event_batch",
    max_retries=3,
    queue="tracking",
)
def process_behavioral_event_batch(self, event_ids: list):
    """Process a batch of behavioral events efficiently."""
    from apps.tracking.models import BehavioralEvent
    from apps.tracking.pipeline import EventProcessor

    try:
        events = BehavioralEvent.objects.filter(
            id__in=event_ids, is_processed=False
        ).select_related("student")

        processor = EventProcessor()
        for event in events:
            processor.process(event)

        logger.info(
            "batch_processed",
            extra={"count": len(event_ids)},
        )
    except Exception as exc:
        logger.error("batch_processing_failed", extra={"error": str(exc)})
        raise self.retry(exc=exc)


@shared_task(
    name="tracking.process_quiz_attempt_event",
    queue="tracking",
)
def process_quiz_attempt_event(attempt_id: str):
    """Synthesize a behavioral event from a quiz attempt."""
    from apps.courses.models import QuizAttempt
    from apps.tracking.models import BehavioralEvent, EventType

    try:
        attempt = QuizAttempt.objects.select_related("student", "quiz__concept").get(
            id=attempt_id
        )
        event_type = EventType.QUIZ_RETRY if attempt.attempt_number > 1 else EventType.QUIZ_SUBMIT

        event = BehavioralEvent.objects.create(
            student=attempt.student,
            event_type=event_type,
            quiz_id=attempt.quiz_id,
            concept_id=attempt.quiz.concept_id if attempt.quiz.concept else None,
            concept_name=attempt.quiz.concept.name if attempt.quiz.concept else "",
            score=attempt.score,
            attempt_number=attempt.attempt_number,
            response_time_seconds=getattr(attempt, "time_taken_seconds", None),
            metadata={"passed": attempt.passed},
        )
        process_behavioral_event.delay(str(event.id))
    except Exception as exc:
        logger.error("quiz_attempt_event_failed", extra={"attempt_id": attempt_id, "error": str(exc)})


@shared_task(
    name="tracking.flush_unprocessed_events",
    queue="tracking",
)
def flush_unprocessed_events():
    """
    Scheduled task: flush any events that slipped through real-time processing.
    Runs every 5 minutes via Celery Beat.
    """
    from apps.tracking.models import BehavioralEvent
    from apps.tracking.pipeline import EventProcessor

    cutoff = timezone.now() - timedelta(minutes=5)
    unprocessed = BehavioralEvent.objects.filter(
        is_processed=False,
        created_at__lt=cutoff,
    ).values_list("id", flat=True)[:200]  # process max 200 at a time

    if unprocessed:
        event_ids = [str(eid) for eid in unprocessed]
        process_behavioral_event_batch.delay(event_ids)
        logger.info("flushed_unprocessed", extra={"count": len(event_ids)})


@shared_task(
    name="tracking.recalculate_student_mastery",
    queue="analytics",
)
def recalculate_student_mastery(student_id: str):
    """
    Recalculate all ConceptMastery scores for a student.
    Triggered after batch processing or on schedule.
    """
    from apps.tracking.pipeline import MasteryCalculator

    try:
        calculator = MasteryCalculator(student_id=student_id)
        calculator.recalculate_all()
        logger.info("mastery_recalculated", extra={"student_id": student_id})
    except Exception as exc:
        logger.error("mastery_recalculation_failed", extra={"student_id": student_id, "error": str(exc)})


@shared_task(
    name="tracking.aggregate_daily_sessions",
    queue="analytics",
)
def aggregate_daily_sessions():
    """
    Nightly: aggregate behavioral events into LearningSession records.
    Computes engagement scores for each session.
    """
    from apps.tracking.pipeline import SessionAggregator

    try:
        aggregator = SessionAggregator()
        count = aggregator.aggregate_yesterday()
        logger.info("sessions_aggregated", extra={"sessions_created": count})
    except Exception as exc:
        logger.error("session_aggregation_failed", extra={"error": str(exc)})
