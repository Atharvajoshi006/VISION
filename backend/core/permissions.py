"""
VISION Platform — Custom Permissions
Role-based access control for all intelligence modules.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStudent(BasePermission):
    """Grants access only to users with role=student."""
    message = "Access restricted to students."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "student"
        )


class IsTutor(BasePermission):
    """Grants access only to users with role=tutor."""
    message = "Access restricted to tutors."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "tutor"
        )


class IsAdmin(BasePermission):
    """Grants access only to admin users."""
    message = "Access restricted to administrators."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (request.user.role == "admin" or request.user.is_staff)
        )


class IsStudentOrTutor(BasePermission):
    """Grants access to students and tutors."""
    message = "Access restricted to students and tutors."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("student", "tutor")
        )


class IsTutorOrAdmin(BasePermission):
    """Grants access to tutors and admins."""
    message = "Access restricted to tutors and administrators."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("tutor", "admin")
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level: owner can access their own data.
    Admin can access all data.
    """
    message = "You can only access your own data."

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin" or request.user.is_staff:
            return True
        owner = getattr(obj, "user", None) or getattr(obj, "student", None)
        return owner == request.user


class ReadOnly(BasePermission):
    """Read-only permission for safe HTTP methods."""
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class IsCourseTutor(BasePermission):
    """
    Object-level: only the tutor who created the course can modify it.
    """
    message = "Only the course creator can modify this course."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.tutor == request.user
