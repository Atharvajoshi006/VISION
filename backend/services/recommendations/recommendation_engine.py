"""
Vision AI — Recommendation Engine Service
"""
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class RecommendationEngine:
    TOP_N = 5
    ALGORITHM_VERSION = "v1_rule_based"

    def __init__(self, student_profile):
        self.student = student_profile

    def generate(self) -> list:
        from apps.learning_profiles.models import LearningProfile
        try:
            profile = self.student.learning_profile
        except LearningProfile.DoesNotExist:
            return self._generate_onboarding_recommendations()

        if not profile.is_mature:
            return self._generate_onboarding_recommendations()

        weak_topics = [item["topic"] for item in profile.weak_topics[:3]]
        candidates = (
            self._score(self._get_next_lessons(), 0.9, "lesson")
            + self._score(self._get_revision_candidates(weak_topics), 0.85, "revision")
            + self._score(self._semantic_search(weak_topics, profile.difficulty_tolerance), 0.75, "lesson")
        )

        seen, unique = set(), []
        for c in sorted(candidates, key=lambda x: x["score"], reverse=True):
            if c["content_id"] not in seen:
                seen.add(c["content_id"])
                unique.append(c)

        return self._persist(unique[:self.TOP_N])

    def _get_next_lessons(self) -> list:
        from apps.progress_tracking.models import LessonProgress
        from apps.courses.models import Lesson
        completed = LessonProgress.objects.filter(
            student=self.student, is_completed=True
        ).values_list("lesson_id", flat=True)
        enrolled = self.student.enrolled_courses.values_list("id", flat=True)
        lessons = Lesson.objects.filter(
            module__course__id__in=enrolled, is_published=True
        ).exclude(id__in=completed).select_related("module__course").order_by(
            "module__course_id", "module__order_index", "order_index"
        )[:10]
        return [{"content_id": str(l.id), "content_title": l.title,
                 "reason": f"Next in {l.module.course.title}"} for l in lessons]

    def _get_revision_candidates(self, weak_topics: list) -> list:
        from apps.progress_tracking.models import LessonProgress
        from apps.courses.models import Lesson
        if not weak_topics:
            return []
        completed_ids = LessonProgress.objects.filter(
            student=self.student, is_completed=True
        ).values_list("lesson_id", flat=True)
        lessons = Lesson.objects.filter(id__in=completed_ids, is_published=True)
        out = []
        for l in lessons:
            overlap = set(l.topics) & set(weak_topics)
            if overlap:
                out.append({"content_id": str(l.id), "content_title": l.title,
                             "reason": f"Revise: {list(overlap)[0]}", "rec_type": "revision"})
        return out[:5]

    def _semantic_search(self, weak_topics: list, difficulty: float) -> list:
        from services.embeddings.chroma_service import ChromaDBService
        if not weak_topics:
            return []
        try:
            results = ChromaDBService().search_lessons(
                query=" ".join(weak_topics), n_results=10, difficulty_filter=difficulty
            )
            return [{"content_id": r["lesson_id"], "content_title": r.get("title", ""),
                     "reason": "Matched to your weak topics"} for r in results]
        except Exception as e:
            logger.warning("ChromaDB search failed: %s", e)
            return []

    def _score(self, candidates, base_score, rec_type) -> list:
        return [{**c, "score": base_score, "rec_type": c.get("rec_type", rec_type)} for c in candidates]

    def _generate_onboarding_recommendations(self) -> list:
        from apps.courses.models import Lesson
        lessons = Lesson.objects.filter(
            module__course__enrollments__student=self.student,
            module__order_index=0, order_index=0, is_published=True
        ).select_related("module__course")[:3]
        return self._persist([{"content_id": str(l.id), "content_title": l.title,
                                "score": 0.9, "reason": "Start here", "rec_type": "lesson"} for l in lessons])

    def _persist(self, candidates: list) -> list:
        from apps.recommendations.models import Recommendation, RecommendationContentType, RecommendationStatus
        Recommendation.objects.filter(
            student=self.student, status=RecommendationStatus.PENDING
        ).update(status=RecommendationStatus.EXPIRED)
        created = []
        for c in candidates:
            rec = Recommendation.objects.create(
                student=self.student,
                content_type=RecommendationContentType.REVISION if c.get("rec_type") == "revision"
                             else RecommendationContentType.LESSON,
                content_id=c["content_id"],
                content_title=c.get("content_title", ""),
                score=c.get("score", 0.5),
                reason=c.get("reason", ""),
                status=RecommendationStatus.PENDING,
                algorithm_version=self.ALGORITHM_VERSION,
                expires_at=timezone.now() + timezone.timedelta(hours=24),
            )
            created.append(rec)
        return created
