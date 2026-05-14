from django.urls import path
from apps.learning_profiles.views import MyLearningProfileView, ProfileHistoryView

app_name = "profiles"
urlpatterns = [
    path("me/",         MyLearningProfileView.as_view(), name="my-profile"),
    path("me/history/", ProfileHistoryView.as_view(),    name="profile-history"),
]
