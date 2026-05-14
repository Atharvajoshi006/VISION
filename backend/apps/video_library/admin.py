"""
Vision AI — Video Library Admin
"""
from django.contrib import admin
from apps.video_library.models import Video, VideoTranscript, VideoSubtitle


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ["title", "tutor", "processing_status", "duration_seconds", "created_at"]
    list_filter = ["processing_status", "language"]
    search_fields = ["title", "tutor__user__email"]
    readonly_fields = ["id", "file_hash", "celery_task_id",
                       "processing_started_at", "processing_completed_at"]
    ordering = ["-created_at"]

    actions = ["reprocess_videos"]

    def reprocess_videos(self, request, queryset):
        for video in queryset:
            from tasks.video_processing import start_video_processing_pipeline
            start_video_processing_pipeline.delay(str(video.id))
        self.message_user(request, f"Reprocessing queued for {queryset.count()} videos.")
    reprocess_videos.short_description = "Reprocess selected videos"
