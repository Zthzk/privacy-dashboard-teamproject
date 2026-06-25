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
        self.assertFalse(data_source.contains_personal_data)
        self.assertEqual(data_source.metadata["risk_level"], "low")

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

    def test_license_plate_violation_raises_risk_to_medium(self):
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
        self.assertEqual(payload["risk_level"], "medium")
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
