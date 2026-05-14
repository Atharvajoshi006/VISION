from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

User = get_user_model()


@admin.register(User)
class VisionUserAdmin(UserAdmin):
    list_display = ["email", "first_name", "last_name", "is_active", "is_staff", "date_joined"]
    list_filter = ["is_active", "is_staff"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["-date_joined"]
    readonly_fields = ["id", "date_joined"]

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "avatar", "timezone")} ),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")} ),
        ("Important dates", {"fields": ("date_joined", "last_login")} ),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "password1", "password2"),
        }),
    )
