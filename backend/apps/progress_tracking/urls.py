from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyProgressViewSet

router = DefaultRouter()
router.register(r"", MyProgressViewSet, basename="my-progress")

urlpatterns = [
    path("", include(router.urls)),
]
