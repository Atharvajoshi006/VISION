"""VISION — recommendations URL routing."""
from django.urls import path
from apps.recommendations.views import (
    MyRecommendationsView, DismissRecommendationView,
    ActOnRecommendationView, RefreshRecommendationsView,
)

urlpatterns = [
    path("me/", MyRecommendationsView.as_view(), name="my-recommendations"),
    path("me/refresh/", RefreshRecommendationsView.as_view(), name="refresh-recommendations"),
    path("<uuid:pk>/dismiss/", DismissRecommendationView.as_view(), name="dismiss-recommendation"),
    path("<uuid:pk>/act/", ActOnRecommendationView.as_view(), name="act-recommendation"),
]
