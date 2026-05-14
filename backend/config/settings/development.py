"""
VISION Platform — Development Settings
"""
from .base import *  # noqa

DEBUG = True
CORS_ALLOW_ALL_ORIGINS = True

# Faster password hashing in development
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Django Debug Toolbar (optional)
try:
    import debug_toolbar
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
    INTERNAL_IPS = ["127.0.0.1"]
except ImportError:
    pass

# Email — print to console in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
