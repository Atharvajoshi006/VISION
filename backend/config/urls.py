from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger UI
schema_view = get_schema_view(
    openapi.Info(
        title="Oblivion VISION‑AI API",
        default_version="v1",
        description="Adaptive learning platform with AI‑generated explanations.",
        contact=openapi.Contact(email="support@oblivion.ai"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("", RedirectView.as_view(url="/swagger/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/users/", include("apps.users.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/progress/", include("apps.progress_tracking.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    # Swagger / Redoc
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
