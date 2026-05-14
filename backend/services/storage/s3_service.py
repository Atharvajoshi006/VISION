"""
Vision AI — S3 / Cloudflare R2 Storage Service
Abstracts all object storage interactions.
"""
import logging
import uuid
from pathlib import PurePosixPath

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


class S3StorageService:
    """
    Wraps boto3 for S3-compatible storage (AWS S3 or Cloudflare R2).
    All video storage goes through this class — no direct boto3 calls in views.

    Design decisions:
    - Pre-signed URLs for client-side downloads (avoids Django serving large files)
    - Storage key = deterministic path, not full URL (URLs change, keys don't)
    - Videos stored under: videos/{tutor_id}/{uuid}.{ext}
    """

    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
        )
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME

    def upload_video(self, file, tutor_id: str) -> str:
        """
        Upload a video file to S3/R2.
        Returns the storage key (not the full URL).
        """
        import os
        ext = os.path.splitext(file.name)[1].lower()
        key = f"videos/{tutor_id}/{uuid.uuid4()}{ext}"
        try:
            file.seek(0)
            self.client.upload_fileobj(
                file,
                self.bucket,
                key,
                ExtraArgs={
                    "ContentType": file.content_type,
                    "ACL": "private",
                },
            )
            logger.info("Uploaded video to s3://%s/%s", self.bucket, key)
            return key
        except (BotoCoreError, ClientError) as e:
            logger.error("S3 upload failed: %s", e)
            raise

    def generate_presigned_url(self, storage_key: str, expiry_seconds: int = 3600) -> str:
        """Generate a time-limited pre-signed URL for private video access."""
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": storage_key},
                ExpiresIn=expiry_seconds,
            )
            return url
        except (BotoCoreError, ClientError) as e:
            logger.error("Failed to generate pre-signed URL: %s", e)
            raise

    def upload_subtitle(self, content: str, video_id: str, language: str, fmt: str = "vtt") -> str:
        """Upload subtitle file and return storage key."""
        key = f"subtitles/{video_id}/{language}.{fmt}"
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=content.encode("utf-8"),
                ContentType="text/vtt" if fmt == "vtt" else "text/plain",
            )
            return key
        except (BotoCoreError, ClientError) as e:
            logger.error("Subtitle upload failed: %s", e)
            raise

    def delete_object(self, storage_key: str) -> None:
        """Hard-delete an object from storage."""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=storage_key)
        except (BotoCoreError, ClientError) as e:
            logger.error("S3 delete failed for key %s: %s", storage_key, e)
            raise
