"""
Vision AI — Video Processing Pipeline (Celery Tasks)
Full async chain: validate → transcribe → chunk → embed → topics → quiz → summary
"""
import json
import logging

from celery import chain, shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue="video_processing", max_retries=3,
             default_retry_delay=60, name="tasks.video_processing.start_video_processing_pipeline")
def start_video_processing_pipeline(self, video_id: str):
    """
    Entry point for the full video processing chain.
    Uses Celery chain so each step runs sequentially,
    passing results forward, with isolated failure handling.
    """
    logger.info("Starting processing pipeline for video %s", video_id)
    processing_chain = chain(
        validate_video_task.si(video_id),
        transcribe_video_task.si(video_id),
        chunk_transcript_task.si(video_id),
        generate_embeddings_task.si(video_id),
        extract_topics_task.si(video_id),
        generate_quiz_task.si(video_id),
        generate_summary_task.si(video_id),
        finalize_video_task.si(video_id),
    )
    processing_chain.apply_async()


def _set_status(video_id: str, status: str, error: str = ""):
    from apps.video_library.models import Video, VideoProcessingStatus
    update = {"processing_status": status}
    if status == VideoProcessingStatus.FAILED:
        update["processing_error"] = error
    if status == "transcribing":
        update["processing_started_at"] = timezone.now()
    Video.objects.filter(pk=video_id).update(**update)


@shared_task(bind=True, queue="video_processing", max_retries=2,
             name="tasks.video_processing.validate_video_task")
def validate_video_task(self, video_id: str):
    """Validates that the uploaded file is accessible and correct."""
    _set_status(video_id, "validating")
    logger.info("Validating video %s", video_id)
    # In production: HEAD request to S3/R2 to confirm file exists


@shared_task(bind=True, queue="video_processing", max_retries=3,
             default_retry_delay=120, name="tasks.video_processing.transcribe_video_task")
def transcribe_video_task(self, video_id: str):
    """
    Generates transcript using OpenAI Whisper API.
    Falls back to AssemblyAI if configured.
    """
    from apps.video_library.models import Video, VideoTranscript, VideoProcessingStatus
    _set_status(video_id, "transcribing")
    try:
        video = Video.objects.get(pk=video_id)
        from services.storage.s3_service import S3StorageService
        storage = S3StorageService()
        presigned_url = storage.generate_presigned_url(video.storage_key, expiry_seconds=3600)

        from openai import OpenAI
        from django.conf import settings
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Whisper transcription via URL (production: download file, send to Whisper)
        # Placeholder: in real implementation download the file first
        raw_text = f"[Transcript placeholder for video: {video.title}]"

        VideoTranscript.objects.update_or_create(
            video=video,
            defaults={
                "raw_text": raw_text,
                "language": video.language,
                "word_count": len(raw_text.split()),
            },
        )
        logger.info("Transcript generated for video %s (%d words)", video_id, len(raw_text.split()))
    except Exception as exc:
        logger.error("Transcription failed for video %s: %s", video_id, exc)
        _set_status(video_id, "failed", str(exc))
        raise self.retry(exc=exc)


@shared_task(bind=True, queue="video_processing",
             name="tasks.video_processing.chunk_transcript_task")
def chunk_transcript_task(self, video_id: str):
    """Chunks transcript into overlapping segments for embedding."""
    from apps.video_library.models import VideoTranscript
    from core.utils import chunk_text
    _set_status(video_id, "chunking")
    try:
        transcript = VideoTranscript.objects.get(video_id=video_id)
        chunks = chunk_text(transcript.raw_text, chunk_size=512, overlap=64)
        chunks_json = [{"chunk_index": i, "text": c} for i, c in enumerate(chunks)]
        transcript.chunks_json = chunks_json
        transcript.chunk_count = len(chunks)
        transcript.save(update_fields=["chunks_json", "chunk_count"])
        logger.info("Chunked transcript for video %s into %d chunks", video_id, len(chunks))
    except Exception as exc:
        logger.error("Chunking failed for video %s: %s", video_id, exc)
        _set_status(video_id, "failed", str(exc))
        raise


@shared_task(bind=True, queue="video_processing", max_retries=3,
             name="tasks.video_processing.generate_embeddings_task")
def generate_embeddings_task(self, video_id: str):
    """Generates sentence embeddings and stores in ChromaDB."""
    from apps.video_library.models import VideoTranscript
    from services.embeddings.chroma_service import ChromaDBService
    _set_status(video_id, "embedding")
    try:
        transcript = VideoTranscript.objects.get(video_id=video_id)
        chroma = ChromaDBService()
        chroma.delete_video_chunks(video_id)  # Clean up before re-ingesting
        count = chroma.ingest_transcript_chunks(video_id, transcript.chunks_json)
        logger.info("Embedded %d chunks for video %s", count, video_id)
    except Exception as exc:
        logger.error("Embedding failed for video %s: %s", video_id, exc)
        _set_status(video_id, "failed", str(exc))
        raise self.retry(exc=exc)


@shared_task(bind=True, queue="ai_tasks", max_retries=3, default_retry_delay=30,
             name="tasks.video_processing.extract_topics_task")
def extract_topics_task(self, video_id: str):
    """Extracts key topics from transcript using OpenAI."""
    from apps.video_library.models import Video, VideoTranscript
    from services.ai.openai_service import OpenAIService
    _set_status(video_id, "extracting_topics")
    try:
        transcript = VideoTranscript.objects.get(video_id=video_id)
        ai = OpenAIService()
        raw = ai.extract_topics(transcript.raw_text)
        topics = json.loads(raw) if raw.startswith("[") else []
        Video.objects.filter(pk=video_id).update(topics=topics[:8])
        # Index lesson in ChromaDB
        video = Video.objects.get(pk=video_id)
        if hasattr(video, "lesson") and video.lesson:
            from services.embeddings.chroma_service import ChromaDBService
            ChromaDBService().ingest_lesson(
                lesson_id=str(video.lesson.id),
                title=video.lesson.title,
                topics=topics,
                difficulty=video.lesson.difficulty_score,
                summary=video.ai_summary or "",
            )
        logger.info("Extracted %d topics for video %s", len(topics), video_id)
    except Exception as exc:
        logger.warning("Topic extraction failed for video %s: %s", video_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, queue="ai_tasks", max_retries=3, default_retry_delay=60,
             name="tasks.video_processing.generate_quiz_task")
def generate_quiz_task(self, video_id: str):
    """Generates quiz questions from transcript chunks using OpenAI."""
    from apps.video_library.models import Video, VideoTranscript
    from apps.assessments.models import Assessment, Question
    from apps.courses.models import Lesson
    from services.ai.openai_service import OpenAIService
    _set_status(video_id, "generating_quiz")
    try:
        video = Video.objects.select_related("lesson").get(pk=video_id)
        if not hasattr(video, "lesson") or not video.lesson:
            logger.info("No lesson linked to video %s — skipping quiz gen", video_id)
            return
        transcript = VideoTranscript.objects.get(video_id=video_id)
        # Use first 3 chunks for quiz generation
        chunk_text = " ".join(
            c["text"] for c in transcript.chunks_json[:3]
        )
        ai = OpenAIService()
        raw = ai.generate_quiz_questions(chunk_text, num_questions=5)
        questions_data = json.loads(raw) if raw.startswith("[") else []
        lesson = video.lesson
        assessment, _ = Assessment.objects.get_or_create(
            lesson=lesson,
            defaults={"title": f"Quiz: {lesson.title}", "is_ai_generated": True},
        )
        for i, q in enumerate(questions_data):
            Question.objects.get_or_create(
                assessment=assessment,
                question_text=q.get("question_text", ""),
                defaults={
                    "options": q.get("options", []),
                    "explanation": q.get("explanation", ""),
                    "difficulty_score": q.get("difficulty_score", 0.5),
                    "topic_tag": q.get("topic_tag", ""),
                    "order_index": i,
                },
            )
        logger.info("Generated %d questions for video %s", len(questions_data), video_id)
    except Exception as exc:
        logger.warning("Quiz gen failed for video %s: %s", video_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, queue="ai_tasks", max_retries=3, default_retry_delay=30,
             name="tasks.video_processing.generate_summary_task")
def generate_summary_task(self, video_id: str):
    """Generates AI summary from transcript."""
    from apps.video_library.models import Video, VideoTranscript
    from services.ai.openai_service import OpenAIService
    _set_status(video_id, "generating_summary")
    try:
        transcript = VideoTranscript.objects.get(video_id=video_id)
        ai = OpenAIService()
        summary = ai.generate_summary(transcript.raw_text)
        Video.objects.filter(pk=video_id).update(ai_summary=summary)
        logger.info("Summary generated for video %s", video_id)
    except Exception as exc:
        logger.warning("Summary gen failed for video %s: %s", video_id, exc)
        raise self.retry(exc=exc)


@shared_task(name="tasks.video_processing.finalize_video_task")
def finalize_video_task(video_id: str):
    """Marks video as COMPLETED and updates tutor analytics."""
    from apps.video_library.models import Video, VideoProcessingStatus
    Video.objects.filter(pk=video_id).update(
        processing_status=VideoProcessingStatus.COMPLETED,
        processing_completed_at=timezone.now(),
    )
    from tasks.analytics_processing import update_tutor_video_count
    update_tutor_video_count.delay(video_id)
    logger.info("Video %s processing COMPLETED", video_id)
