"""VISION — users URL routing."""
from django.urls import path
from apps.users import views

urlpatterns = [
    path("me/", views.CurrentUserView.as_view(), name="current-user"),
    path("me/change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("me/student-profile/", views.StudentProfileView.as_view(), name="student-profile"),
    path("me/tutor-profile/", views.TutorProfileView.as_view(), name="tutor-profile"),
    # Admin
    path("", views.AdminUserListView.as_view(), name="user-list"),
    path("<uuid:pk>/", views.AdminUserDetailView.as_view(), name="user-detail"),
]
