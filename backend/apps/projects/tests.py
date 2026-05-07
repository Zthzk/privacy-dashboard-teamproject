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
