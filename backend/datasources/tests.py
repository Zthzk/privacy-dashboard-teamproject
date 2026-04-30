import json

from django.test import TestCase
from django.urls import reverse

from projects.models import Project
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

    def test_unknown_project_returns_404(self):
        response = self.client.get(
            reverse("project-data-sources", kwargs={"project_id": 9999})
        )

        self.assertEqual(response.status_code, 404)
