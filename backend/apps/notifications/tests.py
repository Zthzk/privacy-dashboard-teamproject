import json

from django.test import TestCase
from django.urls import reverse

from apps.data_sources.models import DataSource
from apps.projects.models import Project

from .models import Notification


class NotificationApiTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(name="Privacy Dashboard")

    def test_lists_notifications_newest_first_with_unread_count(self):
        older = Notification.objects.create(
            notification_type=Notification.Type.PROJECT_CREATED,
            title="Older",
            message="Older notification",
        )
        newer = Notification.objects.create(
            notification_type=Notification.Type.PROJECT_UPDATED,
            title="Newer",
            message="Newer notification",
            is_read=True,
        )

        response = self.client.get(reverse("notifications"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["unread_count"], 1)
        self.assertEqual(
            [item["id"] for item in payload["notifications"]],
            [newer.id, older.id],
        )

    def test_lists_only_the_ten_most_recent_notifications(self):
        notifications = Notification.objects.bulk_create([
            Notification(
                notification_type=Notification.Type.PROJECT_UPDATED,
                title=f"Notification {index}",
                message=f"Message {index}",
            )
            for index in range(12)
        ])

        response = self.client.get(reverse("notifications"))

        returned_ids = [item["id"] for item in response.json()["notifications"]]
        self.assertEqual(len(returned_ids), 10)
        self.assertEqual(returned_ids, [item.id for item in reversed(notifications[2:])])

    def test_marks_one_notification_read(self):
        notification = Notification.objects.create(
            notification_type=Notification.Type.PROJECT_CREATED,
            title="Project created",
            message="A project was created.",
        )

        response = self.client.patch(
            reverse("notification-read", kwargs={"notification_id": notification.id})
        )

        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_marks_all_notifications_read(self):
        Notification.objects.bulk_create([
            Notification(
                notification_type=Notification.Type.PROJECT_CREATED,
                title="First",
                message="First notification",
            ),
            Notification(
                notification_type=Notification.Type.DATA_SOURCE_CREATED,
                title="Second",
                message="Second notification",
            ),
        ])

        response = self.client.post(reverse("notifications-read-all"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["updated"], 2)
        self.assertFalse(Notification.objects.filter(is_read=False).exists())

    def test_project_create_and_delete_generate_notifications_but_update_does_not(self):
        create_response = self.client.post(
            reverse("projects"),
            data=json.dumps({"name": "New Project"}),
            content_type="application/json",
        )
        project_id = create_response.json()["id"]
        detail_url = reverse("project-detail", kwargs={"project_id": project_id})

        self.client.patch(
            detail_url,
            data=json.dumps({"description": "Updated description"}),
            content_type="application/json",
        )
        self.client.delete(detail_url)

        self.assertEqual(
            list(Notification.objects.values_list("notification_type", flat=True)),
            [
                Notification.Type.PROJECT_DELETED,
                Notification.Type.PROJECT_CREATED,
            ],
        )

    def test_data_source_create_generates_notification_but_regular_update_does_not(self):
        list_url = reverse(
            "project-data-sources",
            kwargs={"project_id": self.project.id},
        )
        create_response = self.client.post(
            list_url,
            data=json.dumps({"name": "Customer data"}),
            content_type="application/json",
        )
        data_source = DataSource.objects.get(pk=create_response.json()["id"])
        detail_url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        self.client.patch(
            detail_url,
            data=json.dumps({"name": "Updated customer data"}),
            content_type="application/json",
        )

        self.assertEqual(
            list(Notification.objects.values_list("notification_type", flat=True)),
            [
                Notification.Type.DATA_SOURCE_CREATED,
            ],
        )

    def test_high_risk_create_generates_a_high_risk_notification(self):
        list_url = reverse(
            "project-data-sources",
            kwargs={"project_id": self.project.id},
        )

        response = self.client.post(
            list_url,
            data=json.dumps({
                "name": "Biometric images",
                "data_format": DataSource.DataFormat.IMAGE,
                "compliance_violations": [
                    "Faces or facial features (biometric data identification risks)",
                ],
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["risk_level"], "high")
        self.assertEqual(
            list(Notification.objects.values_list("notification_type", flat=True)),
            [
                Notification.Type.HIGH_RISK_DETECTED,
                Notification.Type.DATA_SOURCE_CREATED,
            ],
        )

    def test_transition_to_high_risk_generates_a_high_risk_notification(self):
        list_url = reverse(
            "project-data-sources",
            kwargs={"project_id": self.project.id},
        )
        create_response = self.client.post(
            list_url,
            data=json.dumps({"name": "Image archive", "data_format": "image"}),
            content_type="application/json",
        )
        Notification.objects.all().delete()
        detail_url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": create_response.json()["id"],
            },
        )

        response = self.client.patch(
            detail_url,
            data=json.dumps({
                "compliance_violations": [
                    "Medical conditions or physical traits visible in images",
                ],
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["risk_level"], "high")
        self.assertEqual(
            list(Notification.objects.values_list("notification_type", flat=True)),
            [
                Notification.Type.HIGH_RISK_DETECTED,
            ],
        )

    def test_noop_updates_do_not_generate_notifications(self):
        list_url = reverse(
            "project-data-sources",
            kwargs={"project_id": self.project.id},
        )
        create_response = self.client.post(
            list_url,
            data=json.dumps({"name": "Stable source"}),
            content_type="application/json",
        )
        data_source = DataSource.objects.get(pk=create_response.json()["id"])
        Notification.objects.all().delete()
        detail_url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        self.client.patch(
            detail_url,
            data=json.dumps({}),
            content_type="application/json",
        )
        self.client.patch(
            reverse("project-detail", kwargs={"project_id": self.project.id}),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(Notification.objects.count(), 0)
