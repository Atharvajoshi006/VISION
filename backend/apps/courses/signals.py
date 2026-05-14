"""
Vision AI — Courses App Signals
Keeps denormalized counters on Course in sync after module/lesson saves.
"""
import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender="courses.Module")
def update_course_module_count(sender, instance, **kwargs):
    """Keep Course.total_modules in sync."""
    course = instance.course
    count = course.modules.filter(is_published=True).count()
    sender._meta.model._meta.model.objects  # avoid circular
    type(course).objects.filter(pk=course.pk).update(total_modules=count)


@receiver([post_save, post_delete], sender="courses.Lesson")
def update_course_lesson_count(sender, instance, **kwargs):
    """Keep Course.total_lessons in sync."""
    course = instance.module.course
    from django.db.models import Sum
    from apps.courses.models import Lesson
    count = Lesson.objects.filter(module__course=course, is_published=True).count()
    from apps.courses.models import Course
    Course.objects.filter(pk=course.pk).update(total_lessons=count)
