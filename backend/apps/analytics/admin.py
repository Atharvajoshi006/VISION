from django.contrib import admin
from .models import AnalyticsSnapshot, ConceptAnalytics, EngagementTrend

admin.site.register(AnalyticsSnapshot)
admin.site.register(ConceptAnalytics)
admin.site.register(EngagementTrend)
