from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    """
    Object‑level permission – allow owners to edit, everybody can read.
    """

    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS (GET, HEAD…) are always allowed
        if request.method in SAFE_METHODS:
            return True
        # otherwise only the owner (or staff) may modify
        return obj.user == request.user or request.user.is_staff
