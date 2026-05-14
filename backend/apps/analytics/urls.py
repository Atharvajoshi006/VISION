from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LearningEventViewSet

router = DefaultRouter()
router.register(r"events", LearningEventViewSet, basename="learning-event")

urlpatterns = [
    path("", include(router.urls)),
]
