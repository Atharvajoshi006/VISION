from __future__ import annotations
from celery import shared_task
from asgiref.sync import async_to_sync
from apps.progress_tracking.models import SkillMastery
from apps.courses.models import Lesson
from services.ai.openai_service import generate_explanation, generate_hint

# ----------------------------------------------------------------------
# 1️⃣ Boost mastery for all skills attached to a completed lesson.
# ----------------------------------------------------------------------
MASTERY_INCR = 0.12
MASTERY_MIN = 0.0
MASTERY_MAX = 0.99


def _clamp(v: float) -> float:
    return max(MASTERY_MIN, min(v, MASTERY_MAX))


@shared_task
def boost_mastery_task(user_id: int, lesson_id: int):
    lesson = Lesson.objects.get(pk=lesson_id)
    skill_ids = lesson.skills.values_list("id", flat=True)

    for skill_id in skill_ids:
        mastery, _ = SkillMastery.objects.select_for_update().get_or_create(
            user_id=user_id,
            skill_id=skill_id,
            defaults={"mastery": 0.0},
        )
        mastery.mastery = _clamp(mastery.mastery + MASTERY_INCR)
        mastery.save(update_fields=["mastery"])


# ----------------------------------------------------------------------
# 2️⃣ Optional: generate AI explanation right after a lesson is marked completed.
# ----------------------------------------------------------------------
@shared_task
def generate_explanation_task(user_id: int, lesson_id: int):
    lesson = Lesson.objects.get(pk=lesson_id)
    skill_names = list(lesson.skills.values_list("name", flat=True))
    context = f"Known skills: {', '.join(skill_names)}"
    explanation = async_to_sync(generate_explanation)(lesson.title, context)

    # Persist as a new Content block (type=article)
    lesson.contents.create(
        type=Lesson.Content.Type.ARTICLE,
        order=lesson.contents.count() + 1,
        data={"title": f"Explanation – {lesson.title}", "body": explanation},
    )
