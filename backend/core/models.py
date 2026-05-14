"""
Vision AI — Abstract Base Model
All models inherit from this to get UUID PKs, timestamps, and soft-delete support.
"""
import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base providing created_at and updated_at timestamps.
    Automatically managed — never set manually.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """
    Abstract base providing a UUID primary key.
    Avoids sequential integer PKs that leak record counts to clients.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """
    Standard base model for all Vision entities.
    Combines UUID PK + automatic timestamps.
    """
    class Meta:
        abstract = True


class SoftDeleteManager(models.Manager):
    """Returns only non-deleted records by default."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def with_deleted(self):
        return super().get_queryset()

    def deleted_only(self):
        return super().get_queryset().filter(is_deleted=True)


class SoftDeleteModel(BaseModel):
    """
    Extends BaseModel with soft-delete capability.
    Records are never physically deleted — is_deleted flag is set instead.
    Useful for audit trails and data recovery.
    """
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Bypass soft-delete filter when needed

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Override delete to perform soft delete."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def hard_delete(self):
        """Physical delete — admin use only."""
        super().delete()

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])
