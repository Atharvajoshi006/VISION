"""
Vision AI — Analytics Processing Tasks (Celery)
Handles async event ingestion, score computation, and profile updates.
"""
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue="analytics", max_retries=5,
             default_retry_delay=10, name="tasks.analytics_processing.ingest_event_batch")
def ingest_event_batch(self, events: list):
    """
    Bulk-writes behavioral events to the database.
    Called by the analytics view after validation — never blocks the HTTP response.
    Batch insert for efficiency: one DB round-trip per batch.
    """
    from apps.analytics.models import LearningBehaviorEvent
    try:
        objs = [
            LearningBehaviorEvent(
                student_id=e["student_id"],
                lesson_id=e.get("lesson_id"),
                video_id=e.get("video_id"),
                assessment_id=e.get("assessment_id"),
                session_id=e["session_id"],
                event_type=e["event_type"],
                event_payload=e.get("event_payload", {}),
                occurred_at=e["occurred_at"],
                client_ip=e.get("client_ip", ""),
                user_agent=e.get("user_agent", ""),
            )
            for e in events
        ]
        LearningBehaviorEvent.objects.bulk_create(objs, ignore_conflicts=True)
        logger.debug("Ingested %d events", len(objs))
    except Exception as exc:
        logger.error("Event batch ingestion failed: %s", exc)
        raise self.retry(exc=exc)


@shared_task(queue="analytics", name="tasks.analytics_processing.flush_pending_events")
def flush_pending_events():
    """
    Periodic task (every 60s via Celery Beat).
    Triggered automatically — no-op if queue is empty.
    Primarily exists as a beat hook for future Redis stream draining.
    """
    logger.debug("flush_pending_events: heartbeat")


@shared_task(queue="recommendations", name="tasks.analytics_processing.update_all_learning_profiles")
def update_all_learning_profiles():
    """
    Periodic task (every 15 min): update profiles for all active students.
    Runs only for students active in the last 24 hours to avoid wasted compute.
    """
    from apps.students.models import StudentProfile
    from django.utils import timezone
    from datetime import timedelta

    cutoff = timezone.now() - timedelta(hours=24)
    active_students = StudentProfile.objects.filter(
        user__last_active_at__gte=cutoff
    ).values_list("id", flat=True)

    for student_id in active_students:
        update_single_student_profile.delay(str(student_id))

    logger.info("Scheduled profile updates for %d active students", len(active_students))


@shared_task(bind=True, queue="recommendations", max_retries=3,
             name="tasks.analytics_processing.update_single_student_profile")
def update_single_student_profile(self, student_profile_id: str):
    """Updates analytics + learning profile for a single student."""
    from apps.students.models import StudentProfile
    from services.analytics.analytics_service import AnalyticsComputationService
    from services.analytics.profile_service import LearningProfileService
    try:
        student = StudentProfile.objects.get(pk=student_profile_id)
        # Step 1: Recompute raw analytics
        AnalyticsComputationService(str(student.user_id)).compute_and_update()
        # Step 2: Update cognitive profile
        LearningProfileService(student).update_profile()
    except StudentProfile.DoesNotExist:
        logger.warning("StudentProfile %s not found", student_profile_id)
    except Exception as exc:
        logger.error("Profile update failed for student %s: %s", student_profile_id, exc)
        raise self.retry(exc=exc)


@shared_task(queue="analytics", name="tasks.analytics_processing.emit_quiz_result_event")
def emit_quiz_result_event(attempt_id: str):
    """Emits analytics events from a quiz attempt completion."""
    from apps.assessments.models import QuizAttempt
    from apps.analytics.models import LearningBehaviorEvent, EventType
    try:
        attempt = QuizAttempt.objects.select_related(
            "student__user", "assessment__lesson"
        ).get(pk=attempt_id)
        event_type = EventType.QUIZ_PASS if attempt.is_passed else EventType.QUIZ_FAIL
        LearningBehaviorEvent.objects.create(
            student_id=attempt.student.user.id,
            lesson_id=attempt.assessment.lesson_id,
            assessment_id=attempt.assessment_id,
            session_id=attempt_id,  # Use attempt ID as session proxy
            event_type=event_type,
            event_payload={
                "score": attempt.score_percent,
                "passed": attempt.is_passed,
                "attempt_number": attempt.attempt_number,
                "time_taken": attempt.time_taken_seconds,
                "topic": attempt.assessment.lesson.topics[0] if attempt.assessment.lesson.topics else "general",
            },
            occurred_at=attempt.completed_at or timezone.now(),
        )
    except Exception as exc:
        logger.error("emit_quiz_result_event failed for attempt %s: %s", attempt_id, exc)


@shared_task(queue="analytics", name="tasks.analytics_processing.compute_tutor_analytics")
def compute_tutor_analytics():
    """Weekly tutor analytics computation (via Beat schedule)."""
    from apps.tutors.models import TutorProfile
    for tutor in TutorProfile.objects.filter(is_verified=True):
        _compute_single_tutor_analytics(tutor)


def _compute_single_tutor_analytics(tutor):
    """Aggregate video performance metrics for a tutor."""
    from apps.video_library.models import Video, VideoProcessingStatus
    from apps.tutors.models import TutorAnalytics
    from django.utils import timezone
    from datetime import timedelta, date
    today = date.today()
    week_start = today - timedelta(days=7)
    videos = Video.objects.filter(
        tutor=tutor,
        processing_status=VideoProcessingStatus.COMPLETED,
    )
    TutorAnalytics.objects.update_or_create(
        tutor=tutor,
        defaults={
            "period_start": week_start,
            "period_end": today,
            "total_views": 0,  # Computed from analytics events in full impl
        },
    )


@shared_task(queue="analytics", name="tasks.analytics_processing.update_tutor_video_count")
def update_tutor_video_count(video_id: str):
    """Increments tutor's total_videos_uploaded counter after successful processing."""
    from apps.video_library.models import Video
    try:
        video = Video.objects.select_related("tutor").get(pk=video_id)
        video.tutor.__class__.objects.filter(pk=video.tutor_id).update(
            total_videos_uploaded=video.tutor.__class__._meta.model.objects.filter(
                pk=video.tutor_id
            ).values("total_videos_uploaded").first()["total_videos_uploaded"] + 1
        )
    except Exception as exc:
        logger.warning("update_tutor_video_count failed: %s", exc)
