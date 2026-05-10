import json

from django.contrib import admin
from django.test import TestCase
from django.urls import reverse

from .admin import ProjectAdmin
from .models import Project


class ProjectModelTests(TestCase):
    def test_project_defaults_to_active_status(self):
        project = Project.objects.create(name="Privacy Dashboard")

        self.assertEqual(project.status, Project.Status.ACTIVE)

    def test_project_string_representation_is_name(self):
        project = Project.objects.create(name="Privacy Dashboard")

        self.assertEqual(str(project), "Privacy Dashboard")

    def test_projects_are_ordered_newest_first(self):
        older_project = Project.objects.create(name="Older Project")
        newer_project = Project.objects.create(name="Newer Project")

        self.assertEqual(list(Project.objects.all()), [newer_project, older_project])


class ProjectAdminTests(TestCase):
    def test_project_admin_is_registered(self):
        self.assertIsInstance(admin.site._registry[Project], ProjectAdmin)

    def test_project_admin_displays_status(self):
        project_admin = admin.site._registry[Project]

        self.assertEqual(
            project_admin.list_display,
            ("name", "status", "created_at", "updated_at"),
        )
        self.assertEqual(project_admin.list_filter, ("status", "created_at"))


class HealthCheckTests(TestCase):
    def test_health_check_returns_success_message(self):
        response = self.client.get(reverse("health-check"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"message": "Privacy Dashboard backend is running"},
        )


class ProjectsApiTests(TestCase):
    def post_json(self, url, payload):
        return self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def patch_json(self, url, payload):
        return self.client.patch(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_can_create_project(self):
        response = self.post_json(
            reverse("projects"),
            {
                "name": "Privacy Dashboard",
                "description": "ML privacy project",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Project.objects.count(), 1)
        payload = response.json()
        self.assertEqual(payload["name"], "Privacy Dashboard")
        self.assertEqual(payload["description"], "ML privacy project")
        self.assertEqual(payload["status"], Project.Status.ACTIVE)

    def test_can_list_projects(self):
        project = Project.objects.create(name="Privacy Dashboard")

        response = self.client.get(reverse("projects"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["projects"]), 1)
        self.assertEqual(payload["projects"][0]["id"], project.id)

    def test_rejects_blank_project_name(self):
        response = self.post_json(reverse("projects"), {"name": ""})

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.json()["errors"])
        self.assertIn("name", response.json())

    def test_can_rename_project(self):
        project = Project.objects.create(name="Old Name")
        url = reverse("project-detail", kwargs={"project_id": project.id})

        response = self.patch_json(url, {"name": "New Name"})

        self.assertEqual(response.status_code, 200)
        project.refresh_from_db()
        self.assertEqual(project.name, "New Name")
        self.assertEqual(response.json()["name"], "New Name")

    def test_can_delete_project(self):
        project = Project.objects.create(name="Temporary Project")
        url = reverse("project-detail", kwargs={"project_id": project.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"deleted": project.id})
        self.assertFalse(Project.objects.filter(id=project.id).exists())
