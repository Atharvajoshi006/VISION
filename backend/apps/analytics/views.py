from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LearningEvent
from .serializers import LearningEventSerializer


class LearningEventViewSet(viewsets.GenericViewSet, mixins.CreateModelMixin, mixins.ListModelMixin):
    """
    POST /api/analytics/events/
    GET  /api/analytics/events/
    """
    queryset = LearningEvent.objects.select_related("lesson", "skill")
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        return LearningEventSerializer
