"""VISION — analytics URL routing."""
from django.urls import path
from apps.analytics.views import (
    MyAnalyticsView, MyEngagementTrendView, MyFeaturesView,
    ConceptHeatmapView, TutorCourseAnalyticsView,
)

urlpatterns = [
    path("me/", MyAnalyticsView.as_view(), name="my-analytics"),
    path("me/trends/", MyEngagementTrendView.as_view(), name="my-trends"),
    path("me/features/", MyFeaturesView.as_view(), name="my-features"),
    path("heatmap/", ConceptHeatmapView.as_view(), name="concept-heatmap"),
    path("course/<uuid:course_id>/", TutorCourseAnalyticsView.as_view(), name="course-analytics"),
]
