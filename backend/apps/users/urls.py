from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterViewSet, LoginViewSet, MeViewSet

router = DefaultRouter()
router.register(r"register", RegisterViewSet, basename="register")
router.register(r"login", LoginViewSet, basename="login")
router.register(r"me", MeViewSet, basename="me")

urlpatterns = [
    path("", include(router.urls)),
]
