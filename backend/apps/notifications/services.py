from .models import Notification


def create_notification(notification_type, title, message, link=""):
    """Create one global notification after a successful application event."""
    return Notification.objects.create(
        notification_type=notification_type,
        title=title,
        message=message,
        link=link,
    )

