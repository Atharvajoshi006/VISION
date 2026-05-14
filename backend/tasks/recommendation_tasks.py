from __future__ import annotations
from celery import shared_task
from apps.recommendations.services import generate_nightly_recommendations


@shared_task
def run_nightly_recommendations():
    """
    Triggered by Celery beat each night.
    """
    generate_nightly_recommendations()
