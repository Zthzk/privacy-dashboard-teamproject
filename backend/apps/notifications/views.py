from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Notification


def serialize_notification(notification):
    return {
        "id": notification.id,
        "type": notification.notification_type,
        "title": notification.title,
        "message": notification.message,
        "link": notification.link,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


@require_http_methods(["GET"])
def notifications(request):
    queryset = Notification.objects.all()
    return JsonResponse(
        {
            # The badge represents every unread row, while the dropdown stays
            # compact by returning only the ten newest notifications.
            "unread_count": queryset.filter(is_read=False).count(),
            "notifications": [
                serialize_notification(notification)
                for notification in queryset[:10]
            ],
        }
    )


@csrf_exempt
@require_http_methods(["PATCH"])
def mark_notification_read(request, notification_id):
    notification = get_object_or_404(Notification, pk=notification_id)
    # Keep repeated clicks idempotent and avoid an unnecessary database write.
    if not notification.is_read:
        notification.is_read = True
        notification.save(update_fields=["is_read"])
    return JsonResponse(serialize_notification(notification))


@csrf_exempt
@require_http_methods(["POST"])
def mark_all_notifications_read(request):
    updated = Notification.objects.filter(is_read=False).update(is_read=True)
    return JsonResponse({"updated": updated, "unread_count": 0})
