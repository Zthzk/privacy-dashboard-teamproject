import json
from datetime import timedelta

from unittest.mock import patch

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import Client, TestCase, TransactionTestCase
from django.urls import reverse
from django.utils import timezone

from apps.projects.models import Project

from .models import DataSource, DataSourceVersion


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

    def detail_url(self, data_source, project=None):
        return reverse(
            "project-data-source-detail",
            kwargs={
                "project_id": (project or self.project).id,
                "data_source_id": data_source.id,
            },
        )

    def versions_url(self, data_source, project=None):
        return reverse(
            "project-data-source-versions",
            kwargs={
                "project_id": (project or self.project).id,
                "data_source_id": data_source.id,
            },
        )

    def version_detail_url(self, data_source, version_number, project=None):
        return reverse(
            "project-data-source-version-detail",
            kwargs={
                "project_id": (project or self.project).id,
                "data_source_id": data_source.id,
                "version_number": version_number,
            },
        )

    def test_can_add_data_source_to_project(self):
        """Creating a data source stores version 1 with the assessed snapshot."""
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
        self.assertFalse(data_source.contains_personal_data)
        self.assertEqual(data_source.metadata["risk_level"], "low")
        self.assertEqual(response.json()["current_version_number"], 1)

        version = DataSourceVersion.objects.get(data_source=data_source)
        self.assertEqual(version.version_number, 1)
        self.assertEqual(version.name, "Customer CSV")
        self.assertEqual(version.source_type, DataSource.SourceType.FILE)
        self.assertEqual(version.data_format, DataSource.DataFormat.CSV)
        self.assertEqual(version.description, "Synthetic customer dataset")
        self.assertEqual(version.location, "datasets/customers.csv")
        self.assertFalse(version.contains_personal_data)
        self.assertEqual(version.metadata["risk_level"], "low")
        self.assertEqual(version.risk_level, "low")
        self.assertEqual(version.art_9_data, "no")

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
        self.assertNotIn("preview_text", payload)
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["art_9_data"], "no")

    def test_large_manual_data_is_stored_without_backend_preview_text(self):
        response = self.post_json(
            self.url,
            {
                "name": "Long manual sample",
                "source_type": DataSource.SourceType.MANUAL,
                "data_format": DataSource.DataFormat.TEXT,
                "location": "manual input",
                "metadata": {"manual_data": "A" * 1200},
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["metadata"]["manual_data"], "A" * 1200)
        self.assertNotIn("preview_text", payload)

    def test_text_fields_do_not_affect_risk_without_violations(self):
        response = self.post_json(
            self.url,
            {
                "name": "Patient Email IP Phone Biometric Dataset",
                "source_type": DataSource.SourceType.API,
                "data_format": DataSource.DataFormat.JSON,
                "description": "Medical diagnosis with fingerprint and facial recognition notes.",
                "location": "https://example.test/users?email=anna@example.com",
                "metadata": {
                    "manual_data": (
                        "Name: Anna Mueller\nEmail: anna@example.com\n"
                        "Phone: +49 123 4567890\nIP: 192.168.1.10\n"
                        "Patient health diagnosis and medication."
                    ),
                },
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertFalse(payload["contains_personal_data"])
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["art_9_data"], "no")

    def test_submitted_contains_personal_data_is_ignored_on_create(self):
        response = self.post_json(
            self.url,
            {
                "name": "Manual Flagged Source",
                "source_type": DataSource.SourceType.MANUAL,
                "data_format": DataSource.DataFormat.TEXT,
                "location": "manual input",
                "contains_personal_data": True,
                "metadata": {"manual_data": "Patient diagnosis and medication notes."},
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertFalse(payload["contains_personal_data"])
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["art_9_data"], "no")

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

    def test_all_data_sources_are_ordered_by_most_recent_update(self):
        recently_edited = DataSource.objects.create(
            project=self.project,
            name="Recently edited",
        )
        newly_created = DataSource.objects.create(
            project=self.project,
            name="Newly created",
        )
        DataSource.objects.filter(pk=recently_edited.pk).update(
            updated_at=timezone.now() + timedelta(minutes=1),
        )

        response = self.client.get(reverse("data-sources"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [source["id"] for source in response.json()["data_sources"]],
            [recently_edited.id, newly_created.id],
        )

    def test_all_data_sources_list_uses_annotated_current_version_number(self):
        data_sources = [
            DataSource.objects.create(project=self.project, name=f"Project data {index}")
            for index in range(3)
        ]
        for data_source in data_sources:
            DataSourceVersion.objects.create(
                data_source=data_source,
                version_number=1,
                name=data_source.name,
                source_type=data_source.source_type,
                data_format=data_source.data_format,
            )

        with self.assertNumQueries(1):
            response = self.client.get(reverse("data-sources"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["data_sources"]), 3)
        self.assertEqual(
            {source["current_version_number"] for source in payload["data_sources"]},
            {1},
        )

    def test_project_data_sources_list_uses_annotated_current_version_number(self):
        data_sources = [
            DataSource.objects.create(project=self.project, name=f"Project data {index}")
            for index in range(3)
        ]
        DataSource.objects.create(project=self.other_project, name="Other data")
        for data_source in data_sources:
            DataSourceVersion.objects.create(
                data_source=data_source,
                version_number=2,
                name=data_source.name,
                source_type=data_source.source_type,
                data_format=data_source.data_format,
            )

        with self.assertNumQueries(2):
            response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["data_sources"]), 3)
        self.assertEqual(
            {source["current_version_number"] for source in payload["data_sources"]},
            {2},
        )

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
        self.assertFalse(data_source.contains_personal_data)
        self.assertEqual(data_source.metadata["risk_level"], "low")

    def test_recalculates_risk_from_violations_when_data_source_is_updated(self):
        data_source = DataSource.objects.create(
            project=self.project,
            name="Old Source",
            metadata={"manual_data": "Email: old@example.com. Medical diagnosis included."},
            contains_personal_data=True,
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
                "contains_personal_data": True,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(payload["contains_personal_data"])
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["art_9_data"], "no")

    def test_update_creates_next_version_when_versioned_fields_change(self):
        """Changing versioned fields appends the next backend-owned version."""
        create_response = self.post_json(
            self.url,
            {
                "name": "Support Notes",
                "source_type": DataSource.SourceType.MANUAL,
                "metadata": {"manual_data": "No personal data here."},
            },
        )
        data_source = DataSource.objects.get(id=create_response.json()["id"])

        response = self.client.patch(
            self.detail_url(data_source),
            data=json.dumps({
                "metadata": {
                    "manual_data": "Email: anna@example.com. Medical diagnosis included.",
                },
                "version_number": 99,
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["current_version_number"], 2)
        versions = list(data_source.versions.order_by("version_number"))
        self.assertEqual([version.version_number for version in versions], [1, 2])
        self.assertEqual(versions[0].metadata["manual_data"], "No personal data here.")
        self.assertEqual(versions[0].risk_level, "low")
        self.assertIn("Medical diagnosis", versions[1].metadata["manual_data"])
        self.assertEqual(versions[1].risk_level, "low")
        self.assertEqual(versions[1].art_9_data, "no")

    def test_update_locks_parent_row_before_allocating_next_version(self):
        """Updating a data source locks the parent before assigning a version."""
        create_response = self.post_json(self.url, {"name": "Lock Test Source"})
        data_source = DataSource.objects.get(id=create_response.json()["id"])

        with patch.object(
            DataSource.objects,
            "select_for_update",
            wraps=DataSource.objects.select_for_update,
        ) as select_for_update:
            response = self.client.patch(
                self.detail_url(data_source),
                data=json.dumps({"name": "Locked Source"}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(select_for_update.called)
        self.assertEqual(response.json()["current_version_number"], 2)

    def test_noop_update_does_not_create_duplicate_version(self):
        """No-op updates keep the existing latest version instead of duplicating it."""
        create_response = self.post_json(
            self.url,
            {
                "name": "Stable Source",
                "metadata": {"manual_data": "No personal data here."},
            },
        )
        data_source = DataSource.objects.get(id=create_response.json()["id"])

        response = self.client.patch(
            self.detail_url(data_source),
            data=json.dumps({}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["current_version_number"], 1)
        self.assertEqual(data_source.versions.count(), 1)

    def test_lists_and_fetches_data_source_versions(self):
        """Version history endpoints expose newest-first list and exact detail."""
        create_response = self.post_json(
            self.url,
            {
                "name": "Support Notes",
                "metadata": {"manual_data": "No personal data here."},
            },
        )
        data_source = DataSource.objects.get(id=create_response.json()["id"])
        self.client.patch(
            self.detail_url(data_source),
            data=json.dumps({"name": "Updated Support Notes"}),
            content_type="application/json",
        )

        list_response = self.client.get(self.versions_url(data_source))
        detail_response = self.client.get(self.version_detail_url(data_source, 1))

        self.assertEqual(list_response.status_code, 200)
        payload = list_response.json()
        self.assertEqual(payload["data_source"], data_source.id)
        self.assertEqual(payload["project"], self.project.id)
        self.assertEqual(
            [version["version_number"] for version in payload["versions"]],
            [2, 1],
        )
        self.assertEqual(payload["versions"][0]["name"], "Updated Support Notes")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["version_number"], 1)
        self.assertEqual(detail_response.json()["name"], "Support Notes")

    def test_version_history_is_scoped_to_current_project_after_move(self):
        """Moving projects keeps lineage but exposes history only under the new route."""
        create_response = self.post_json(self.url, {"name": "Movable Source"})
        data_source = DataSource.objects.get(id=create_response.json()["id"])

        response = self.client.patch(
            self.detail_url(data_source),
            data=json.dumps({"project": self.other_project.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data_source.versions.count(), 1)
        old_project_response = self.client.get(self.versions_url(data_source))
        new_project_response = self.client.get(
            self.versions_url(data_source, project=self.other_project)
        )
        self.assertEqual(old_project_response.status_code, 404)
        self.assertEqual(new_project_response.status_code, 200)
        self.assertEqual(new_project_response.json()["versions"][0]["version_number"], 1)
        old_project_detail_response = self.client.get(
            self.version_detail_url(data_source, 1)
        )
        new_project_detail_response = self.client.get(
            self.version_detail_url(data_source, 1, project=self.other_project)
        )
        self.assertEqual(old_project_detail_response.status_code, 404)
        self.assertEqual(new_project_detail_response.status_code, 200)
        self.assertEqual(new_project_detail_response.json()["version_number"], 1)

    def test_deleting_data_source_cascades_versions(self):
        """Deleting the current data source deletes its version history too."""
        create_response = self.post_json(self.url, {"name": "Temporary Source"})
        data_source = DataSource.objects.get(id=create_response.json()["id"])
        version_id = data_source.versions.get().id

        response = self.client.delete(self.detail_url(data_source))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(DataSourceVersion.objects.filter(id=version_id).exists())

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

    def test_can_create_data_source_with_compliance_violations(self):
        response = self.post_json(
            self.url,
            {
                "name": "Face Image Set",
                "source_type": DataSource.SourceType.FILE,
                "data_format": DataSource.DataFormat.IMAGE,
                "compliance_violations": ["Faces or facial features (biometric data identification risks)"],
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(
            payload["compliance_violations"],
            ["Faces or facial features (biometric data identification risks)"],
        )

    def test_can_update_compliance_violations(self):
        data_source = DataSource.objects.create(
            project=self.project,
            name="Audio Clips",
            data_format=DataSource.DataFormat.AUDIO,
            compliance_violations=["Voice recordings capable of identifying specific natural persons"],
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={"project_id": self.project.id, "data_source_id": data_source.id},
        )

        response = self.client.patch(
            url,
            data=json.dumps({"compliance_violations": []}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["compliance_violations"], [])


class ComplianceViolationRiskTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(name="Risk Test Project")
        self.url = reverse(
            "project-data-sources",
            kwargs={"project_id": self.project.id},
        )

    def post_json(self, payload):
        return self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def test_face_violation_raises_risk_to_high(self):
        response = self.post_json({
            "name": "Face Dataset",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.IMAGE,
            "compliance_violations": [
                "Faces or facial features (biometric data identification risks)",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["art_9_data"], "possible")
        self.assertTrue(payload["contains_personal_data"])

    def test_single_personal_data_violation_stays_low_but_flags_personal_data(self):
        # A single weight-1 finding is below the medium threshold (2), so the
        # risk level stays low while the personal-data flag is still set.
        response = self.post_json({
            "name": "Traffic Camera Feed",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.IMAGE,
            "compliance_violations": [
                "License plates or vehicle identifiers",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "low")
        self.assertTrue(payload["contains_personal_data"])

    def test_general_compliance_violation_raises_risk_without_personal_data(self):
        response = self.post_json({
            "name": "Completeness Report",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.CSV,
            "compliance_violations": [
                "Evaluate data completeness, identifying missing attributes or anomalies that degrade safety",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "medium")
        self.assertEqual(payload["art_9_data"], "no")
        self.assertFalse(payload["metadata"]["contains_art9_data"])
        self.assertFalse(payload["contains_personal_data"])

    def test_multiple_general_compliance_violations_raise_high_without_personal_data(self):
        response = self.post_json({
            "name": "Scraped Bias Report",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.IMAGE,
            "compliance_violations": [
                "Check if images were harvested via untargeted scraping",
                "Evaluate if dataset representation has demographic gaps or biases",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["art_9_data"], "no")
        self.assertFalse(payload["metadata"]["contains_art9_data"])
        self.assertFalse(payload["contains_personal_data"])

    def test_three_weight_1_violations_escalate_to_high_without_art9(self):
        # Three simultaneous personal data categories carry compounded risk equal
        # to a high-risk source, but they are still not Art. 9 data.
        response = self.post_json({
            "name": "Customer Text Export",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.TEXT,
            "compliance_violations": [
                "Names, surnames, and pseudonyms",
                "Email addresses and domain information",
                "Phone numbers and digital messaging handles",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["art_9_data"], "no")
        self.assertFalse(payload["metadata"]["contains_art9_data"])
        self.assertTrue(payload["contains_personal_data"])

    def test_two_weight_1_violations_stay_at_medium(self):
        response = self.post_json({
            "name": "Newsletter List",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.TEXT,
            "compliance_violations": [
                "Names, surnames, and pseudonyms",
                "Email addresses and domain information",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "medium")

    def test_no_violations_do_not_fall_back_to_keyword_detection(self):
        response = self.post_json({
            "name": "Patient Notes",
            "source_type": DataSource.SourceType.MANUAL,
            "data_format": DataSource.DataFormat.TEXT,
            "metadata": {"manual_data": "Patient health diagnosis."},
            "compliance_violations": [],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["art_9_data"], "no")
        self.assertFalse(payload["contains_personal_data"])

    def test_unknown_violation_labels_are_ignored(self):
        response = self.post_json({
            "name": "Unknown Violation Source",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.OTHER,
            "compliance_violations": ["This label does not exist in the weights registry"],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "low")

    def test_clearing_all_violations_returns_risk_to_low(self):
        # Regression: previously the old contains_personal_data=True on the model
        # was used as assessment input, so clearing violations kept risk at medium.
        data_source = DataSource.objects.create(
            project=self.project,
            name="Image Set",
            data_format=DataSource.DataFormat.IMAGE,
            compliance_violations=["Faces or facial features (biometric data identification risks)"],
            contains_personal_data=True,
            metadata={"risk_level": "high"},
        )
        url = reverse(
            "project-data-source-detail",
            kwargs={"project_id": self.project.id, "data_source_id": data_source.id},
        )

        response = self.client.patch(
            url,
            data=json.dumps({"compliance_violations": []}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["risk_level"], "low")
        self.assertFalse(payload["contains_personal_data"])
        self.assertFalse(payload["metadata"]["contains_art9_data"])

    def test_violation_score_is_stored_in_metadata(self):
        response = self.post_json({
            "name": "Voice Dataset",
            "source_type": DataSource.SourceType.FILE,
            "data_format": DataSource.DataFormat.AUDIO,
            "compliance_violations": [
                "Voice recordings capable of identifying specific natural persons",
            ],
        })

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["metadata"]["violation_score"], 3)


class DataFormatHintsApiTests(TestCase):
    def test_returns_hints_for_all_known_formats(self):
        response = self.client.get(reverse("data-format-hints"))

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        for data_format in ["image", "text", "csv", "json", "other"]:
            self.assertIn(data_format, payload)
            self.assertIn("hint", payload[data_format])
            self.assertIn("art9_risk", payload[data_format])
            self.assertIn("relevant_articles", payload[data_format])
            self.assertIn("checklist", payload[data_format])

    def test_checklist_items_include_weight_and_article(self):
        response = self.client.get(reverse("data-format-hints"))

        payload = response.json()
        for item in payload["image"]["checklist"]:
            self.assertIn("label", item)
            self.assertIn("weight", item)
            self.assertIn("article", item)
            self.assertIn("is_personal_data", item)
            self.assertIn("is_art_9", item)
            self.assertIsInstance(item["weight"], int)
            self.assertIs(type(item["is_personal_data"]), bool)
            self.assertIs(type(item["is_art_9"]), bool)

    def test_face_checklist_item_has_art9_weight(self):
        response = self.client.get(reverse("data-format-hints"))

        payload = response.json()
        face_item = next(
            item for item in payload["image"]["checklist"]
            if item["label"] == "Faces or facial features (biometric data identification risks)"
        )
        self.assertEqual(face_item["weight"], 3)
        self.assertIn("Art. 9", face_item["article"])

    def test_license_plate_has_lower_weight_than_face(self):
        response = self.client.get(reverse("data-format-hints"))

        payload = response.json()
        checklist = {item["label"]: item for item in payload["image"]["checklist"]}
        self.assertLess(
            checklist["License plates or vehicle identifiers"]["weight"],
            checklist["Faces or facial features (biometric data identification risks)"]["weight"],
        )

    def test_image_format_has_art9_risk(self):
        response = self.client.get(reverse("data-format-hints"))

        payload = response.json()
        self.assertTrue(payload["image"]["art9_risk"])

    def test_non_image_formats_have_no_art9_risk(self):
        response = self.client.get(reverse("data-format-hints"))

        payload = response.json()
        for data_format in ["text", "csv", "json", "other"]:
            self.assertFalse(payload[data_format]["art9_risk"])
class DataSourceVersionMigrationTests(TransactionTestCase):
    # Keep unrelated Project schema at its current migration while exercising
    # the historical DataSource version backfill in isolation.
    migrate_from = [
        ("projects", "0002_project_style"),
        ("data_sources", "0003_datasource_compliance_violations"),
    ]
    migrate_to = [
        ("projects", "0002_project_style"),
        ("data_sources", "0004_datasourceversion"),
    ]

    def setUp(self):
        super().setUp()
        self.executor = MigrationExecutor(connection)
        self.executor.migrate(self.migrate_from)
        old_apps = self.executor.loader.project_state(self.migrate_from).apps

        ProjectModel = old_apps.get_model("projects", "Project")
        DataSourceModel = old_apps.get_model("data_sources", "DataSource")
        project = ProjectModel.objects.create(name="Migrated Project")
        self.data_source_id = DataSourceModel.objects.create(
            project=project,
            name="Migrated Source",
            source_type="manual",
            data_format="text",
            description="Existing source",
            location="manual input",
            contains_personal_data=True,
            metadata={
                "manual_data": "Email: anna@example.com",
                "risk_level": "medium",
                "art_9_data": "no",
                "contains_art9_data": False,
            },
            compliance_violations=["Existing violation"],
        ).id

        self.executor.loader.build_graph()
        self.executor.migrate(self.migrate_to)
        self.apps = self.executor.loader.project_state(self.migrate_to).apps

    def test_backfills_initial_version_from_existing_data_source_fields(self):
        """Migrating existing data sources creates version 1 without reassessment."""
        DataSourceVersionModel = self.apps.get_model(
            "data_sources",
            "DataSourceVersion",
        )

        version = DataSourceVersionModel.objects.get(data_source_id=self.data_source_id)

        self.assertEqual(version.version_number, 1)
        self.assertEqual(version.name, "Migrated Source")
        self.assertEqual(version.source_type, "manual")
        self.assertEqual(version.data_format, "text")
        self.assertEqual(version.description, "Existing source")
        self.assertEqual(version.location, "manual input")
        self.assertTrue(version.contains_personal_data)
        self.assertEqual(version.metadata["manual_data"], "Email: anna@example.com")
        self.assertEqual(version.risk_level, "medium")
        self.assertEqual(version.art_9_data, "no")
        self.assertFalse(version.contains_art9_data)
        self.assertEqual(version.compliance_violations, ["Existing violation"])
