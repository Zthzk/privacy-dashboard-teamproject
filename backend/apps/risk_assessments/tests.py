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

    def test_missing_project_returns_404(self):
        response = self.client.get(
            reverse("project-risk-assessment", kwargs={"project_id": 9999})
        )

        self.assertEqual(response.status_code, 404)
