"""
VISION Platform — Celery Application
Intelligence Pipeline Task Queue Configuration
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("vision")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks across all intelligence modules
app.autodiscover_tasks([
    "apps.tracking.tasks",
    "apps.analytics.tasks",
    "apps.predictions.tasks",
    "apps.cognitive_profiles.tasks",
    "apps.recommendations.tasks",
    "apps.interventions.tasks",
    "apps.ai_services.tasks",
    "apps.dependency_graph.tasks",
])

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Health check task for Celery workers."""
    print(f"Request: {self.request!r}")
