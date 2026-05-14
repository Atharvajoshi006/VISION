# backend/apps/progress_tracking/views.py
from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LessonProgress, SkillMastery
from .serializers import LessonProgressSerializer, SkillMasterySerializer


class MyProgressViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/progress/
    Returns the authenticated user’s lesson‑progress and skill‑mastery.
    """
    permission_classes = (IsAuthenticated,)

    # Dummy queryset – required only for drf‑yasg.
    queryset = LessonProgress.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return LessonProgress.objects.none()
        return LessonProgress.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        lessons_qs = LessonProgress.objects.filter(user=request.user).select_related(
            "lesson"
        )
        skills_qs = SkillMastery.objects.filter(user=request.user).select_related(
            "skill"
        )
        lesson_ser = LessonProgressSerializer(lessons_qs, many=True)
        skill_ser = SkillMasterySerializer(skills_qs, many=True)

        return Response(
            {"lessons": lesson_ser.data, "skills": skill_ser.data},
            status=status.HTTP_200_OK,
        )
