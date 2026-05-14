"""
VISION Platform — Main URL Configuration
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# ==============================================================================
# API Documentation
# ==============================================================================
schema_view = get_schema_view(
    openapi.Info(
        title="VISION Intelligence Platform API",
        default_version="v1",
        description=(
            "VISION — AI-Driven Adaptive Learning Intelligence Platform.\n\n"
            "A behavioral intelligence engine that tracks, profiles, predicts, "
            "and adapts educational experiences in real-time.\n\n"
            "**Modules:**\n"
            "- Authentication & Role Management\n"
            "- Course & Content Management\n"
            "- Behavioral Event Tracking (High-throughput)\n"
            "- Cognitive Profiling Engine\n"
            "- Knowledge Dependency Graph\n"
            "- Analytics Pipeline\n"
            "- Failure Prediction System\n"
            "- Adaptive Recommendation Engine\n"
            "- Intervention System\n"
            "- Gemini AI Services Layer\n"
            "- Intelligence Dashboards\n"
        ),
        contact=openapi.Contact(email="support@vision-ai.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# ==============================================================================
# URL Patterns — API v1
# ==============================================================================
api_v1_patterns = [
    # Authentication
    path("auth/", include("apps.authentication.urls")),
    # Users & Profiles
    path("users/", include("apps.users.urls")),
    # Course Management
    path("courses/", include("apps.courses.urls")),
    # Behavioral Tracking Engine (high-frequency endpoint)
    path("tracking/", include("apps.tracking.urls")),
    # Cognitive Profiles
    path("profiles/", include("apps.cognitive_profiles.urls")),
    # Knowledge Dependency Graph
    path("graph/", include("apps.dependency_graph.urls")),
    # Analytics Engine
    path("analytics/", include("apps.analytics.urls")),
    # Failure Prediction System
    path("predictions/", include("apps.predictions.urls")),
    # Adaptive Recommendations
    path("recommendations/", include("apps.recommendations.urls")),
    # Intervention System
    path("interventions/", include("apps.interventions.urls")),
    # Gemini AI Services
    path("ai/", include("apps.ai_services.urls")),
    # Dashboards & Reports
    path("dashboards/", include("apps.dashboards.urls")),
]

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Versioned API
    path("api/v1/", include(api_v1_patterns)),

    # API Documentation
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "redoc/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Add debug toolbar if installed
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass
