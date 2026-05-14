"""VISION — cognitive_profiles URL routing."""
from django.urls import path
from apps.cognitive_profiles import views

urlpatterns = [
    path("me/", views.MyCognitiveProfileView.as_view(), name="my-cognitive-profile"),
    path("me/history/", views.ProfileHistoryView.as_view(), name="profile-history"),
    path("me/refresh/", views.RefreshProfileView.as_view(), name="profile-refresh"),
    path("", views.AdminProfileView.as_view(), name="admin-profiles"),
]
