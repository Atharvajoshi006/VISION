from django.urls import path
from apps.tutors.views import MyTutorProfileView, TutorPublicProfileView

app_name = "tutors"
urlpatterns = [
    path("me/",          MyTutorProfileView.as_view(),     name="my-profile"),
    path("<uuid:pk>/",   TutorPublicProfileView.as_view(), name="public-profile"),
]
