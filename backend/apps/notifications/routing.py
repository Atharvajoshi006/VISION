from django.urls import path

from .consumers import MentorConsumer

websocket_urlpatterns = [
    path("ws/mentor/", MentorConsumer.as_asgi()),
]
