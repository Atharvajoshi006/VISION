from django.urls import path
from apps.video_library.views import VideoUploadView, VideoStatusView, VideoDetailView

app_name = "videos"

urlpatterns = [
    path("upload/",           VideoUploadView.as_view(),  name="video-upload"),
    path("<uuid:pk>/",        VideoDetailView.as_view(),  name="video-detail"),
    path("<uuid:pk>/status/", VideoStatusView.as_view(),  name="video-status"),
]
