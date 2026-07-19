from django.urls import path

from . import views


urlpatterns = [
    path("notifications/", views.notifications, name="notifications"),
    path(
        "notifications/read-all/",
        views.mark_all_notifications_read,
        name="notifications-read-all",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        views.mark_notification_read,
        name="notification-read",
    ),
]

