"""
VISION Platform — Base Django Settings
AI-Driven Adaptive Learning Intelligence Engine
"""
import os
from datetime import timedelta
from pathlib import Path

import environ

# ==============================================================================
# Paths
# ==============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env(
    DEBUG=(bool, False),
    DJANGO_ENV=(str, "development"),
    SECRET_KEY=(str, "CHANGE_ME_IN_PRODUCTION"),
    ALLOWED_HOSTS=(list, ["*"]),
    REDIS_URL=(str, "redis://127.0.0.1:6379/0"),
    CELERY_BROKER_URL=(str, "redis://127.0.0.1:6379/1"),
    CELERY_RESULT_BACKEND=(str, "redis://127.0.0.1:6379/2"),
    CELERY_TASK_ALWAYS_EAGER=(bool, False),
    GEMINI_API_KEY=(str, ""),
    GEMINI_MODEL=(str, "gemini-1.5-flash"),
    ML_MODELS_DIR=(str, "ml_models/"),
    ENABLE_ML_PREDICTIONS=(bool, True),
    ENABLE_GEMINI_AI=(bool, True),
    ENABLE_ADAPTIVE_INTERVENTIONS=(bool, True),
    LOG_LEVEL=(str, "INFO"),
    FRONTEND_URL=(str, "http://localhost:3000"),
    GOOGLE_CLIENT_ID=(str, ""),
    GOOGLE_CLIENT_SECRET=(str, ""),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:3000", "http://127.0.0.1:3000"]),
    SUPABASE_URL=(str, ""),
    SUPABASE_JWT_SECRET=(str, ""),
)

# Read .env file from backend root
environ.Env.read_env(BASE_DIR / ".env")

# ==============================================================================
# Core Django
# ==============================================================================
SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_ALL_ORIGINS = False

# Google OAuth Credentials
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET")

INSTALLED_APPS = [
    # Third-party
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "corsheaders",
    "django_filters",
    "django_celery_results",
    "django_celery_beat",
    "drf_yasg",
    # Vision Core
    "core",
    # Vision Apps — Intelligence Modules
    "apps.authentication",
    "apps.users",
    "apps.courses",
    "apps.tracking",
    "apps.cognitive_profiles",
    "apps.dependency_graph",
    "apps.analytics",
    "apps.predictions",
    "apps.recommendations",
    "apps.interventions",
    "apps.ai_services",
    "apps.dashboards",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.RequestIDMiddleware",
    "core.middleware.BehavioralTrackingMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "users.User"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ==============================================================================
# Database — SQLite (Development Default)
# ==============================================================================
DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
}

# ==============================================================================
# Cache — Redis
# ==============================================================================
REDIS_URL = env("REDIS_URL")

# Try Redis cache — fall back to local memory if Redis not available
try:
    import redis as _redis_lib
    _redis_lib.StrictRedis.from_url(REDIS_URL, socket_connect_timeout=2).ping()
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "SOCKET_CONNECT_TIMEOUT": 5,
                "SOCKET_TIMEOUT": 5,
                "IGNORE_EXCEPTIONS": True,
            },
            "KEY_PREFIX": "vision",
            "TIMEOUT": 300,
        }
    }
except Exception:
    # Redis not available (dev without Redis) — use in-memory cache
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "vision-dev-cache",
        }
    }

SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ==============================================================================
# Authentication & DRF
# ==============================================================================
# Supabase JWT verification — replaces SimpleJWT entirely
SUPABASE_URL = env("SUPABASE_URL")
SUPABASE_JWT_SECRET = env("SUPABASE_JWT_SECRET")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.authentication.supabase_auth.SupabaseAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.VisionPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "ai_generation": "20/hour",
        "tracking": "500/minute",
    },
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "EXCEPTION_HANDLER": "core.exceptions.vision_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.openapi.AutoSchema",
}

# ==============================================================================
# Celery — Async Intelligence Processing
# ==============================================================================
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND")
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_ENABLE_UTC = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 300         # 5 min hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 240    # 4 min soft limit
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Celery task routing — intelligence pipeline queues
CELERY_TASK_ROUTES = {
    # High-priority: real-time behavioral processing
    "apps.tracking.tasks.*": {"queue": "tracking"},
    # Medium-priority: ML analytics and predictions
    "apps.analytics.tasks.*": {"queue": "analytics"},
    "apps.predictions.tasks.*": {"queue": "predictions"},
    "apps.cognitive_profiles.tasks.*": {"queue": "profiling"},
    # Lower-priority: recommendations and interventions
    "apps.recommendations.tasks.*": {"queue": "recommendations"},
    "apps.interventions.tasks.*": {"queue": "interventions"},
    # AI generation (rate-limited)
    "apps.ai_services.tasks.*": {"queue": "ai_generation"},
}

# ==============================================================================
# Gemini AI Configuration
# Key is read from .env — GEMINI_API_KEY
# ==============================================================================
GEMINI_API_KEY = env("GEMINI_API_KEY")
GEMINI_MODEL = env("GEMINI_MODEL")
GEMINI_MAX_OUTPUT_TOKENS = 2048
GEMINI_TEMPERATURE = 0.7
GEMINI_RESPONSE_CACHE_TTL = 3600     # 1 hour AI response cache
ENABLE_GEMINI_AI = env.bool("ENABLE_GEMINI_AI")

# ==============================================================================
# Machine Learning Configuration
# ==============================================================================
ML_MODELS_DIR = BASE_DIR / env("ML_MODELS_DIR")
ENABLE_ML_PREDICTIONS = env.bool("ENABLE_ML_PREDICTIONS")
ENABLE_ADAPTIVE_INTERVENTIONS = env.bool("ENABLE_ADAPTIVE_INTERVENTIONS")

# Prediction thresholds
FAILURE_PREDICTION_THRESHOLD = 0.65       # >= 65% → high risk
DROPOUT_PREDICTION_THRESHOLD = 0.70       # >= 70% → dropout risk
INTERVENTION_TRIGGER_THRESHOLD = 0.60    # >= 60% → trigger intervention

# ==============================================================================
# Vision Intelligence Settings
# ==============================================================================
VISION_SETTINGS = {
    # Behavioral tracking
    "TRACKING_BATCH_SIZE": 50,           # events to accumulate before processing
    "TRACKING_FLUSH_INTERVAL": 60,       # seconds between batch flushes
    "EVENT_RETENTION_DAYS": 365,         # keep raw events for 1 year

    # Cognitive profiling
    "PROFILE_RECALCULATION_INTERVAL": 3600,  # recalculate every hour
    "MIN_EVENTS_FOR_PROFILE": 10,             # min events before profiling

    # Analytics
    "ANALYTICS_SNAPSHOT_INTERVAL": 86400,    # daily snapshots
    "WEAK_CONCEPT_THRESHOLD": 0.5,           # below 50% mastery = weak

    # Recommendations
    "MAX_RECOMMENDATIONS": 5,
    "RECOMMENDATION_CACHE_TTL": 1800,        # 30 min cache

    # Interventions
    "INTERVENTION_COOLDOWN": 86400,          # 24 hrs before re-triggering
    "MAX_ACTIVE_INTERVENTIONS": 3,
}

# ==============================================================================
# Static & Media Files
# ==============================================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ==============================================================================
# CORS
# ==============================================================================
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)
CORS_ALLOW_CREDENTIALS = True

# ==============================================================================
# Password Validation
# ==============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ==============================================================================
# Email
# ==============================================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@vision-ai.com")

# ==============================================================================
# Internationalization
# ==============================================================================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==============================================================================
# Logging — Structured
# ==============================================================================
LOG_LEVEL = env("LOG_LEVEL")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] [{levelname}] [{name}] [{process:d}] {message}",
            "style": "{",
        },
        "vision_json": {
            "()": "core.logging.VisionJSONFormatter",
        },
    },
    "filters": {
        "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "vision_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "vision.log",
            "maxBytes": 10 * 1024 * 1024,  # 10 MB
            "backupCount": 5,
            "formatter": "vision_json",
        },
        "tracking_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "tracking.log",
            "maxBytes": 50 * 1024 * 1024,  # 50 MB (high volume)
            "backupCount": 10,
            "formatter": "vision_json",
        },
        "prediction_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "predictions.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "vision_json",
        },
        "ai_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "ai_services.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "vision_json",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
        },
        "vision": {
            "handlers": ["console", "vision_file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "vision.tracking": {
            "handlers": ["console", "tracking_file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "vision.predictions": {
            "handlers": ["console", "prediction_file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "vision.ai": {
            "handlers": ["console", "ai_file"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },
}
