# backend/apps/analytics/serializers.py
"""
DRF serializers for the analytics app.
"""
from rest_framework import serializers
from .models import LearningEvent


class LearningEventSerializer(serializers.ModelSerializer):
    """
    Serializes a LearningEvent instance.

    All fields are read‑only **except** ``payload`` – callers can send
    additional context when they create a new event.  ``timestamp`` is
    automatically set by the model, so we expose it as read‑only.
    """

    class Meta:
        model = LearningEvent
        fields = (
            "id",
            "event_type",
            "occurred_at",   # <-- matches the model field exactly
            "lesson",
            "skill",
            "payload",
        )
        read_only_fields = ("id", "occurred_at")
