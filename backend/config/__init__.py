"""
Vision AI — config package init.
Loads Celery app so it initializes with Django.
"""
from .celery import app as celery_app

__all__ = ["celery_app"]
