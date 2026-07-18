from django.db import models


class Notification(models.Model):
    """A persistent, application-wide notification for the single-user dashboard."""

    class Type(models.TextChoices):
        # Update types remain valid for historical rows, although regular edits
        # no longer create new notifications.
        PROJECT_CREATED = "project_created", "Project created"
        PROJECT_UPDATED = "project_updated", "Project updated"
        PROJECT_DELETED = "project_deleted", "Project deleted"
        DATA_SOURCE_CREATED = "data_source_created", "Data source created"
        DATA_SOURCE_UPDATED = "data_source_updated", "Data source updated"
        DATA_SOURCE_DELETED = "data_source_deleted", "Data source deleted"
        HIGH_RISK_DETECTED = "high_risk_detected", "High risk detected"

    notification_type = models.CharField(max_length=40, choices=Type.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    # Store a frontend route rather than a database relation so deleted objects
    # do not invalidate the notification history.
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["is_read", "-created_at"], name="notif_read_created_idx"),
        ]

    def __str__(self):
        return self.title
