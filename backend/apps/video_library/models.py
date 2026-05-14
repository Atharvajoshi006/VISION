"""
Vision AI — Video Library Models
Handles video upload state machine, transcripts, and processing metadata.
"""

from django.db import models

from core.models import BaseModel


class VideoProcessingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    VALIDATING = "validating", "Validating"
    TRANSCRIBING = "transcribing", "Transcribing"
    CHUNKING = "chunking", "Chunking Transcript"
    EMBEDDING = "embedding", "Generating Embeddings"
    EXTRACTING_TOPICS = "extracting_topics", "Extracting Topics"
    GENERATING_QUIZ = "generating_quiz", "Generating Quiz"
    GENERATING_SUMMARY = "generating_summary", "Generating Summary"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class Video(BaseModel):
    """
    Tutor-uploaded video. Acts as the source of all AI-processed content.

    Processing follows a strict state machine (VideoProcessingStatus).
    Each stage is handled by a dedicated Celery task.
    The lesson FK is nullable so videos can be uploaded before
    course structure is finalized.
    """
    tutor = models.ForeignKey(
        "tutors.TutorProfile",
        on_delete=models.PROTECT,
        related_name="videos",
    )

    # Storage
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    storage_key = models.CharField(
        max_length=500,
        unique=True,
        help_text="S3/R2 object key — never the full URL.",
    )
    storage_url = models.URLField(
        blank=True,
        help_text="CDN URL — derived from storage_key, not stored permanently.",
    )
    file_hash = models.CharField(
        max_length=64,
        unique=True,
        help_text="SHA-256 of the uploaded file for deduplication.",
    )
    file_size_bytes = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    # AI-extracted metadata (populated by processing pipeline)
    topics = models.JSONField(
        blank=True,
        default=list,
        db_index=False,
    )
    ai_summary = models.TextField(
        blank=True,
        help_text="AI-generated summary of the video content.",
    )
    language = models.CharField(max_length=10, default="en")

    # Processing state machine
    processing_status = models.CharField(
        max_length=30,
        choices=VideoProcessingStatus.choices,
        default=VideoProcessingStatus.PENDING,
        db_index=True,
    )
    processing_error = models.TextField(
        blank=True,
        help_text="Error message if processing failed.",
    )
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processing_completed_at = models.DateTimeField(null=True, blank=True)
    celery_task_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Root Celery task ID for tracking processing pipeline.",
    )

    class Meta:
        db_table = "video_library_video"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tutor", "processing_status"], name="idx_video_tutor_status"),
            models.Index(fields=["processing_status"], name="idx_video_status"),
            models.Index(fields=["file_hash"], name="idx_video_hash"),
        ]

    def __str__(self):
        return f"{self.title} [{self.processing_status}]"

    @property
    def is_ready(self) -> bool:
        return self.processing_status == VideoProcessingStatus.COMPLETED


class VideoTranscript(BaseModel):
    """
    Stores the raw and chunked transcript for a video.
    raw_text: full concatenated transcript
    chunks_json: list of {"chunk_index": int, "text": str, "start_char": int, "end_char": int}
    This JSONB structure avoids a separate chunk table while staying queryable.
    """
    video = models.OneToOneField(
        Video,
        on_delete=models.CASCADE,
        related_name="transcript",
    )
    raw_text = models.TextField()
    chunks_json = models.JSONField(
        default=list,
        help_text="Chunked transcript segments for embedding pipeline.",
    )
    language = models.CharField(max_length=10, default="en")
    word_count = models.PositiveIntegerField(default=0)
    chunk_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "video_library_videotranscript"

    def __str__(self):
        return f"Transcript({self.video.title})"


class VideoSubtitle(BaseModel):
    """
    SRT/VTT subtitle file for a video.
    Supports multiple languages per video.
    """
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="subtitles")
    language = models.CharField(max_length=10)
    storage_key = models.CharField(max_length=500)
    format = models.CharField(max_length=10, default="vtt", choices=[("vtt", "VTT"), ("srt", "SRT")])

    class Meta:
        db_table = "video_library_videosubtitle"
        unique_together = [("video", "language", "format")]
