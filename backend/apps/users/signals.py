"""
Vision AI — Users App Signals
Auto-create role-specific profiles when a user is created.
"""
import logging

from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

User = get_user_model()


@receiver(post_save, sender=User)
def create_role_profile(sender, instance: User, created: bool, **kwargs):
    """
    Auto-creates StudentProfile or TutorProfile upon user creation.
    Uses get_or_create to be idempotent — safe to run multiple times.
    """
    if not created:
        return

    if instance.role == "student":
        from apps.users.models import StudentProfile
        StudentProfile.objects.get_or_create(user=instance)
        logger.info("StudentProfile created for user %s", instance.id)

    elif instance.role == "tutor":
        from apps.users.models import TutorProfile
        TutorProfile.objects.get_or_create(user=instance)
        logger.info("TutorProfile created for user %s", instance.id)
