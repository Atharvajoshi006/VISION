# backend/apps/analytics/admin.py
"""
Admin registration for the Analytics app.

At the moment the analytics app only contains a single model:
`LearningEvent`.  If you later add extra models (e.g. `LearningBehaviorEvent`,
`StudentAnalytics`, `LearningSession`) you can register them here as well.
"""

from django.contrib import admin
from .models import LearningEvent


@admin.register(LearningEvent)
class LearningEventAdmin(admin.ModelAdmin):
    """Admin UI for the LearningEvent model."""

    # Columns shown in the list view
    list_display = (
        "id",
        "user",
        "event_type",
        "occurred_at",
        "lesson",
        "skill",
    )
    # Filters in the right‑hand sidebar
    list_filter = ("event_type", "occurred_at", "lesson", "skill")
    # Fields searchable via the search box
    search_fields = ("user__email", "lesson__title", "skill__name")
    # Make the timestamp read‑only (it is auto‑generated)
    readonly_fields = ("occurred_at",)

    # Optional: show the JSON payload in a nicer way
    def payload_display(self, obj):
        import json

        return json.dumps(obj.payload, indent=2)

    payload_display.short_description = "Payload"
    # Add a read‑only field that shows nicely formatted JSON
    readonly_fields = ("occurred_at", "payload_display")
