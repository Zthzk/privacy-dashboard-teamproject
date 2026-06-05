import json

from django.test import Client, TestCase
from django.urls import reverse

from apps.projects.models import Project

from .models import DataSource


class ProjectDataSourcesApiTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(
            name="Privacy Dashboard",
            description="ML privacy project",
        )
        self.other_project = Project.objects.create(name="Other Project")
        self.url = reverse(
            "project-data-sources",
            kwargs={"project_id": self.project.id},
        )

    def post_json(self, url, payload):
        return self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_can_add_data_source_to_project(self):
        response = self.post_json(
            self.url,
            {
                "name": "Customer CSV",
                "source_type": DataSource.SourceType.FILE,
                "data_format": DataSource.DataFormat.CSV,
                "description": "Synthetic customer dataset",
                "location": "datasets/customers.csv",
                "contains_personal_data": True,
                "metadata": {"columns": ["email", "name"]},
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DataSource.objects.count(), 1)

        data_source = DataSource.objects.get()
        self.assertEqual(data_source.project, self.project)
        self.assertEqual(data_source.name, "Customer CSV")
        self.assertEqual(data_source.source_type, DataSource.SourceType.FILE)
        self.assertEqual(data_source.data_format, DataSource.DataFormat.CSV)
        self.assertTrue(data_source.contains_personal_data)

    def test_can_add_data_source_with_frontend_payload(self):
        response = self.post_json(
            self.url,
            {
                "name": "Manual customer notes",
                "source_type": DataSource.SourceType.MANUAL,
                "data_format": DataSource.DataFormat.TEXT,
                "location": "manual input",
                "metadata": {"manual_data": "Example customer note"},
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["name"], "Manual customer notes")
        self.assertEqual(payload["source_type"], DataSource.SourceType.MANUAL)
        self.assertEqual(payload["data_format"], DataSource.DataFormat.TEXT)
        self.assertEqual(payload["location"], "manual input")
        self.assertFalse(payload["contains_personal_data"])
        self.assertEqual(payload["metadata"]["manual_data"], "Example customer note")
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["art_9_data"], "no")

    def test_detects_personal_data_risk_from_manual_data(self):
        response = self.post_json(
            self.url,
            {
                "name": "Support notes",
                "source_type": DataSource.SourceType.MANUAL,
                "data_format": DataSource.DataFormat.TEXT,
                "location": "manual input",
                "metadata": {
                    "manual_data": "Name: Anna Mueller\nEmail: anna@example.com",
                },
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertTrue(payload["contains_personal_data"])
        self.assertEqual(payload["risk_level"], "medium")
        self.assertEqual(payload["art_9_data"], "no")
        self.assertIn("email", payload["metadata"]["personal_data_categories"])
        self.assertIn("name", payload["metadata"]["personal_data_categories"])
        self.assertIn("contact_data", payload["metadata"]["data_category_keys"])
        self.assertIn("direct_identifiers", payload["metadata"]["data_category_keys"])

    def test_detects_art_9_risk_from_manual_data(self):
        response = self.post_json(
            self.url,
            {
                "name": "Patient notes",
                "source_type": DataSource.SourceType.MANUAL,
                "data_format": DataSource.DataFormat.TEXT,
                "location": "manual input",
                "metadata": {
                    "manual_data": "Patient diagnosis and medication notes.",
                },
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertTrue(payload["contains_personal_data"])
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["art_9_data"], "possible")
        self.assertIn("health", payload["metadata"]["art_9_categories"])
        self.assertIn("health_data", payload["metadata"]["data_category_keys"])

    def test_can_add_data_source_with_csrf_checks_enabled(self):
        csrf_client = Client(enforce_csrf_checks=True)

        response = csrf_client.post(
            self.url,
            data=json.dumps({"name": "API Source"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            DataSource.objects.filter(
                project=self.project,
                name="API Source",
            ).exists()
        )

    def test_lists_only_data_sources_for_requested_project(self):
        DataSource.objects.create(
            project=self.project,
            name="Project data",
            source_type=DataSource.SourceType.FILE,
            data_format=DataSource.DataFormat.JSON,
        )
        DataSource.objects.create(
            project=self.other_project,
            name="Other data",
            source_type=DataSource.SourceType.API,
            data_format=DataSource.DataFormat.JSON,
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project"]["id"], self.project.id)
        self.assertEqual(len(payload["data_sources"]), 1)
        self.assertEqual(payload["data_sources"][0]["name"], "Project data")

    def test_can_list_all_data_sources_across_projects(self):
        DataSource.objects.create(
            project=self.project,
            name="Project data",
            contains_personal_data=True,
            metadata={"risk_level": "high", "art_9_data": "possible"},
        )
        DataSource.objects.create(
            project=self.other_project,
            name="Other data",
        )

        response = self.client.get(reverse("data-sources"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["data_sources"]), 2)
        first_source = payload["data_sources"][0]
        self.assertIn("project_name", first_source)
        self.assertIn("risk_level", first_source)
        self.assertIn("art_9_data", first_source)

    def test_rejects_duplicate_data_source_name_within_project(self):
        DataSource.objects.create(project=self.project, name="Duplicate")

        response = self.post_json(self.url, {"name": "Duplicate"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(DataSource.objects.count(), 1)

    def test_allows_same_data_source_name_in_different_projects(self):
        DataSource.objects.create(project=self.other_project, name="Shared")

        response = self.post_json(self.url, {"name": "Shared"})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(DataSource.objects.count(), 2)

    def test_rejects_invalid_source_type(self):
        response = self.post_json(
            self.url,
            {
                "name": "Broken Source",
                "source_type": "spreadsheet",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("source_type", response.json()["errors"])

    def test_can_update_data_source(self):
        data_source = DataSource.objects.create(
            project=self.project,
            name="Old Source",
            source_type=DataSource.SourceType.FILE,
            data_format=DataSource.DataFormat.TEXT,
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        response = self.client.patch(
            url,
            data=json.dumps({
                "name": "Updated Source",
                "source_type": DataSource.SourceType.API,
                "data_format": DataSource.DataFormat.JSON,
                "location": "https://example.test/api",
                "contains_personal_data": True,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        data_source.refresh_from_db()
        self.assertEqual(data_source.name, "Updated Source")
        self.assertEqual(data_source.source_type, DataSource.SourceType.API)
        self.assertEqual(data_source.data_format, DataSource.DataFormat.JSON)
        self.assertEqual(data_source.location, "https://example.test/api")
        self.assertTrue(data_source.contains_personal_data)
        self.assertEqual(data_source.metadata["risk_level"], "medium")

    def test_recalculates_risk_when_data_source_is_updated(self):
        data_source = DataSource.objects.create(
            project=self.project,
            name="Old Source",
            metadata={"manual_data": "No personal data here."},
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        response = self.client.patch(
            url,
            data=json.dumps({
                "metadata": {
                    "manual_data": "Email: anna@example.com. Medical diagnosis included.",
                },
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["contains_personal_data"])
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["art_9_data"], "possible")

    def test_can_move_data_source_to_another_project(self):
        data_source = DataSource.objects.create(
            project=self.project,
            name="Movable Source",
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        response = self.client.patch(
            url,
            data=json.dumps({"project": self.other_project.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        data_source.refresh_from_db()
        self.assertEqual(data_source.project, self.other_project)
        self.assertEqual(response.json()["project"], self.other_project.id)
        self.assertEqual(response.json()["project_name"], self.other_project.name)

    def test_rejects_move_when_name_already_exists_in_target_project(self):
        DataSource.objects.create(
            project=self.other_project,
            name="Duplicate In Target",
        )
        data_source = DataSource.objects.create(
            project=self.project,
            name="Duplicate In Target",
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        response = self.client.patch(
            url,
            data=json.dumps({"project": self.other_project.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        data_source.refresh_from_db()
        self.assertEqual(data_source.project, self.project)

    def test_can_delete_data_source(self):
        data_source = DataSource.objects.create(
            project=self.project,
            name="Temporary Source",
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"deleted": data_source.id})
        self.assertFalse(DataSource.objects.filter(id=data_source.id).exists())

    def test_cannot_update_data_source_from_other_project(self):
        data_source = DataSource.objects.create(
            project=self.other_project,
            name="Other Project Source",
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": self.project.id,
                "data_source_id": data_source.id,
            },
        )

        response = self.client.patch(
            url,
            data=json.dumps({"name": "Should Not Update"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
        data_source.refresh_from_db()
        self.assertEqual(data_source.name, "Other Project Source")

    def test_unknown_project_returns_404(self):
        response = self.client.get(
            reverse("project-data-sources", kwargs={"project_id": 9999})
        )

        self.assertEqual(response.status_code, 404)

