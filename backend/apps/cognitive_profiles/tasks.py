"""VISION — cognitive profile Celery tasks."""
import logging
from celery import shared_task

logger = logging.getLogger("vision")


@shared_task(name="cognitive_profiles.recalculate_cognitive_profile", queue="profiling")
def recalculate_cognitive_profile(student_id: str):
    from apps.cognitive_profiles.engine import CognitiveProfileEngine
    engine = CognitiveProfileEngine(student_id=student_id)
    engine.recalculate()


@shared_task(name="cognitive_profiles.recalculate_all_profiles", queue="profiling")
def recalculate_all_profiles():
    """Nightly: recalculate profiles for all active students."""
    from django.conf import settings
    from apps.users.models import User

    students = User.objects.filter(role="student", is_active=True).values_list("id", flat=True)
    for student_id in students:
        recalculate_cognitive_profile.apply_async(
            args=[str(student_id)],
            queue="profiling",
            countdown=0,
        )
    logger.info("profile_recalculation_queued", extra={"count": len(students)})
