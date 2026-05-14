"""VISION — tracking URL routing."""
from django.urls import path
from apps.tracking import views

urlpatterns = [
    path("events/", views.EventIngestView.as_view(), name="event-ingest"),
    path("events/bulk/", views.BulkEventIngestView.as_view(), name="event-bulk-ingest"),
    path("events/history/", views.StudentEventHistoryView.as_view(), name="event-history"),
    path("mastery/", views.ConceptMasteryView.as_view(), name="concept-mastery"),
    path("weak-concepts/", views.WeakConceptsView.as_view(), name="weak-concepts"),
    path("sessions/", views.LearningSessionListView.as_view(), name="learning-sessions"),
    path("admin/events/", views.AdminEventView.as_view(), name="admin-events"),
]
