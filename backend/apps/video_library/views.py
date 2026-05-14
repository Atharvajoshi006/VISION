"""
Vision AI — Video Library Views
Upload endpoint triggers the async processing pipeline.
"""
import logging

from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.video_library.models import Video, VideoProcessingStatus
from apps.video_library.serializers import VideoSerializer, VideoUploadSerializer
from core.exceptions import VideoProcessingError
from core.permissions import IsVerifiedTutor
from core.utils import compute_file_hash, validate_video_file
from services.storage.s3_service import S3StorageService

logger = logging.getLogger(__name__)


class VideoUploadView(APIView):
    """
    POST /api/v1/videos/upload/

    Multi-step upload:
    1. Validate file (type, size, MIME)
    2. Compute SHA-256 hash for deduplication
    3. Upload to S3/R2
    4. Create Video record with PENDING status
    5. Kick off async processing chain via Celery
    """
    permission_classes = [IsVerifiedTutor]
    parser_classes = [MultiPartParser]
    throttle_scope = "video_upload"

    def post(self, request):
        serializer = VideoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data["file"]
        title = serializer.validated_data["title"]
        description = serializer.validated_data.get("description", "")

        # Step 1: Validate file
        is_valid, error_msg = validate_video_file(file)
        if not is_valid:
            raise VideoProcessingError(detail=error_msg)

        # Step 2: Deduplication check
        file_hash = compute_file_hash(file)
        if Video.objects.filter(file_hash=file_hash).exists():
            return Response(
                {"error": {"code": "duplicate_video", "message": "This video has already been uploaded."}},
                status=status.HTTP_409_CONFLICT,
            )

        # Step 3: Upload to object storage
        storage_service = S3StorageService()
        storage_key = storage_service.upload_video(file, tutor_id=str(request.user.id))

        # Step 4: Create Video record
        video = Video.objects.create(
            tutor=request.user.tutor_profile,
            title=title,
            description=description,
            storage_key=storage_key,
            file_hash=file_hash,
            file_size_bytes=file.size,
            mime_type=file.content_type,
            processing_status=VideoProcessingStatus.PENDING,
        )

        # Step 5: Trigger async processing chain
        from tasks.video_processing import start_video_processing_pipeline
        task = start_video_processing_pipeline.delay(str(video.id))
        video.celery_task_id = task.id
        video.save(update_fields=["celery_task_id"])

        logger.info("Video %s uploaded by tutor %s, pipeline started", video.id, request.user.id)

        return Response(
            {
                "video_id": str(video.id),
                "status": video.processing_status,
                "message": "Video uploaded successfully. Processing has started.",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class VideoStatusView(APIView):
    """GET /api/v1/videos/{id}/status/ — poll processing status"""
    permission_classes = [IsVerifiedTutor]

    def get(self, request, pk):
        try:
            video = Video.objects.get(pk=pk, tutor=request.user.tutor_profile)
        except Video.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Video not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "video_id": str(video.id),
            "title": video.title,
            "status": video.processing_status,
            "error": video.processing_error or None,
            "processing_started_at": video.processing_started_at,
            "processing_completed_at": video.processing_completed_at,
        })


class VideoDetailView(APIView):
    """GET /api/v1/videos/{id}/ — video metadata for students"""
    permission_classes = [IsVerifiedTutor.__bases__[0]]  # IsAuthenticated

    def get(self, request, pk):
        try:
            video = Video.objects.get(pk=pk, processing_status=VideoProcessingStatus.COMPLETED)
        except Video.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Video not found or not yet processed."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = VideoSerializer(video)
        return Response(serializer.data)
