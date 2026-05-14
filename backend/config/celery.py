import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("oblivion")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks(
    [
        "users.tasks",
        "courses.tasks",
        "progress_tracking.tasks",
        "recommendations.tasks",
        "analytics.tasks",
        "notifications.tasks",
    ]
)
