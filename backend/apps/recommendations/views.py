# backend/apps/recommendations/views.py
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated

from .models import Recommendation
from .serializers import RecommendationSerializer


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/recommendations/
    Returns the latest cached recommendation payload for the logged‑in user.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = RecommendationSerializer

    # Dummy queryset – required only for drf‑yasg.
    queryset = Recommendation.objects.none()

    def get_queryset(self):
        """
        During a real request we filter by the authenticated user.
        While drf‑yasg builds the schema ``self.request.user`` is an
        ``AnonymousUser``; in that case we return an empty queryset.
        """
        if getattr(self, 'swagger_fake_view', False):
            return Recommendation.objects.none()
        user = self.request.user
        if user and user.is_authenticated:
            return Recommendation.objects.filter(user=user).order_by("-generated_at")
        return Recommendation.objects.none()
