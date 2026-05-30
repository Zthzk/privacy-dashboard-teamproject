from django.test import TestCase
from django.urls import reverse

from apps.data_sources.models import DataSource
from apps.projects.models import Project


class ProjectRiskAssessmentApiTests(TestCase):
    def risk_url(self, project):
        return reverse(
            "project-risk-assessment",
            kwargs={"project_id": project.id},
        )

    def test_empty_project_returns_green_risk_assessment(self):
        project = Project.objects.create(name="Empty Project")

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project_id"], project.id)
        self.assertEqual(payload["overall_status"], "green")
        self.assertEqual(payload["risk_level"], "low")
        self.assertEqual(payload["metrics"]["total_data_sources"], 0)
        self.assertEqual(payload["metrics"]["personal_data_sources"], 0)
        self.assertGreaterEqual(len(payload["recommendations"]), 1)

    def test_personal_data_returns_yellow_risk_assessment(self):
        project = Project.objects.create(name="Personal Data Project")
        DataSource.objects.create(
            project=project,
            name="Newsletter Subscribers",
            contains_personal_data=True,
            metadata={"risk_level": "yellow"},
        )

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["overall_status"], "yellow")
        self.assertEqual(payload["risk_level"], "medium")
        self.assertEqual(payload["metrics"]["total_data_sources"], 1)
        self.assertEqual(payload["metrics"]["personal_data_sources"], 1)
        self.assertEqual(payload["metrics"]["medium_risk_sources"], 1)

    def test_art9_or_high_risk_data_returns_red_risk_assessment(self):
        project = Project.objects.create(name="Sensitive Data Project")
        DataSource.objects.create(
            project=project,
            name="Medical Notes",
            contains_personal_data=True,
            metadata={"risk_level": "red", "contains_art9_data": True},
        )

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["overall_status"], "red")
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["metrics"]["high_risk_sources"], 1)
        self.assertEqual(payload["metrics"]["art_9_sources"], 1)

    def test_returns_top_detected_data_categories(self):
        project = Project.objects.create(name="Category Project")
        DataSource.objects.create(
            project=project,
            name="Support Contacts",
            contains_personal_data=True,
            metadata={
                "risk_level": "medium",
                "data_category_keys": ["contact_data", "direct_identifiers"],
            },
        )
        DataSource.objects.create(
            project=project,
            name="Patient Notes",
            contains_personal_data=True,
            metadata={
                "risk_level": "high",
                "contains_art9_data": True,
                "data_category_keys": ["health_data", "contact_data"],
            },
        )

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        categories = response.json()["top_detected_data_categories"]
        category_by_key = {category["key"]: category for category in categories}
        self.assertEqual(category_by_key["contact_data"]["source_count"], 2)
        self.assertEqual(category_by_key["contact_data"]["label"], "Contact Data")
        self.assertEqual(category_by_key["direct_identifiers"]["source_count"], 1)
        self.assertEqual(category_by_key["health_data"]["source_count"], 1)
        self.assertTrue(category_by_key["health_data"]["is_art_9"])

    def test_missing_project_returns_404(self):
        response = self.client.get(
            reverse("project-risk-assessment", kwargs={"project_id": 9999})
        )

        self.assertEqual(response.status_code, 404)
