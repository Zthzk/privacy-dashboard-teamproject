import json

from django.test import TestCase
from django.urls import reverse

from apps.data_sources.models import DataSource

from .models import Project


def assert_serialized_project(test_case, payload, project):
    """Keep the API contract explicit because frontend project pages depend on it."""
    test_case.assertEqual(payload["id"], project.id)
    test_case.assertEqual(payload["name"], project.name)
    test_case.assertEqual(payload["description"], project.description)
    test_case.assertIn("data_sources_count", payload)
    test_case.assertIn("created_at", payload)
    test_case.assertIn("updated_at", payload)


class ProjectModelTests(TestCase):
    def test_project_string_representation_is_name(self):
        project = Project.objects.create(name="Privacy Dashboard")

        self.assertEqual(str(project), "Privacy Dashboard")

    def test_projects_are_ordered_newest_first(self):
        older_project = Project.objects.create(name="Older Project")
        newer_project = Project.objects.create(name="Newer Project")

        self.assertEqual(list(Project.objects.all()), [newer_project, older_project])


class HealthCheckTests(TestCase):
    def test_health_check_returns_success_message(self):
        response = self.client.get(reverse("health-check"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"message": "Privacy Dashboard backend is running"},
        )


class ProjectsApiTests(TestCase):
    def setUp(self):
        self.list_url = reverse("projects")

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

    def detail_url(self, project):
        return reverse("project-detail", kwargs={"project_id": project.id})

    def test_can_create_project(self):
        response = self.post_json(
            self.list_url,
            {
                "name": "Privacy Dashboard",
                "description": "ML project inventory",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Project.objects.count(), 1)
        project = Project.objects.get()
        payload = response.json()
        assert_serialized_project(self, payload, project)
        self.assertEqual(payload["data_sources_count"], 0)

    def test_can_list_projects(self):
        project = Project.objects.create(name="Privacy Dashboard")

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["projects"]), 1)
        assert_serialized_project(self, payload["projects"][0], project)
        self.assertEqual(payload["projects"][0]["data_sources_count"], 0)

    def test_can_get_project_detail(self):
        project = Project.objects.create(
            name="Privacy Dashboard",
            description="ML project inventory",
        )

        response = self.client.get(self.detail_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        assert_serialized_project(self, payload, project)
        self.assertEqual(payload["data_sources_count"], 0)

    def test_project_data_source_count_is_derived_from_related_sources(self):
        project = Project.objects.create(name="Privacy Dashboard")
        DataSource.objects.create(project=project, name="product_manuals.pdf")

        response = self.client.get(self.detail_url(project))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data_sources_count"], 1)

    def test_rejects_blank_project_name(self):
        response = self.post_json(self.list_url, {"name": ""})

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.json()["errors"])
        self.assertIn("name", response.json())

    def test_can_update_project_name_and_description(self):
        project = Project.objects.create(name="Old Name")

        response = self.patch_json(
            self.detail_url(project),
            {
                "name": "New Name",
                "description": "Updated description",
            },
        )

        self.assertEqual(response.status_code, 200)
        project.refresh_from_db()
        self.assertEqual(project.name, "New Name")
        self.assertEqual(project.description, "Updated description")
        self.assertEqual(response.json()["name"], "New Name")

    def test_can_delete_project(self):
        project = Project.objects.create(name="Temporary Project")

        response = self.client.delete(self.detail_url(project))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"deleted": project.id})
        self.assertFalse(Project.objects.filter(id=project.id).exists())

    def test_missing_project_detail_returns_404(self):
        response = self.client.get(
            reverse("project-detail", kwargs={"project_id": 9999})
        )

        self.assertEqual(response.status_code, 404)
