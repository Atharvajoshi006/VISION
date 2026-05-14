from django.urls import path
from apps.students.views import MyStudentProfileView, EnrollCourseView

app_name = "students"
urlpatterns = [
    path("me/",                       MyStudentProfileView.as_view(), name="my-profile"),
    path("enroll/<uuid:course_id>/",  EnrollCourseView.as_view(),     name="enroll-course"),
]
