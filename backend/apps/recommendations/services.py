from __future__ import annotations
import logging
from typing import List, Dict
from django.db.models import Prefetch
from apps.courses.models import Lesson, Skill
from apps.progress_tracking.models import SkillMastery, LessonProgress

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# Core recommendation algorithm (weighted skill‑gap)
# ----------------------------------------------------------------------
def recommend_for_user(user_id: int, limit: int = 5) -> List[Dict]:
    # 1️⃣ Load current mastery per skill
    mastery_qs = SkillMastery.objects.filter(user_id=user_id)
    mastery_map = {m.skill_id: m.mastery for m in mastery_qs}
    # 2️⃣ Exclude lessons already completed
    completed_ids = LessonProgress.objects.filter(user_id=user_id, status=LessonProgress.Status.COMPLETED)        .values_list("lesson_id", flat=True)

    candidates = Lesson.objects.filter(is_published=True)        .exclude(id__in=completed_ids)        .prefetch_related("skills", "module__course")

    scored = []
    for lesson in candidates:
        need = 0.0
        for skill in lesson.skills.all():
            mastery = mastery_map.get(skill.id, 0.0)
            need += (1 - mastery) * skill.weight
        scored.append((lesson, need))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:limit]

    return [
        {
            "type": "lesson",
            "id": lesson.id,
            "title": lesson.title,
            "module": lesson.module.title,
            "course": lesson.module.course.title,
            "need_score": round(score, 3),
        }
        for lesson, score in top
    ]


# ----------------------------------------------------------------------
# Nightly batch job – stores Recommendation objects.
# ----------------------------------------------------------------------
def generate_nightly_recommendations():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    for user in User.objects.filter(is_active=True).iterator():
        payload = recommend_for_user(user.id, limit=5)
        Recommendation.objects.update_or_create(
            user=user,
            defaults={"payload": payload},
        )
        logger.info("Generated nightly recommendations for %s", user.email)
