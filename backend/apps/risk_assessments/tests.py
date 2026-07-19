from django.test import TestCase
from django.urls import reverse

from apps.data_sources.models import DataSource
from apps.projects.models import Project
from apps.risk_assessments.services import (
    apply_data_source_risk_assessment,
    assess_data_source_risk,
)
from apps.risk_assessments.violation_weights import VIOLATION_WEIGHTS


class ComplianceViolationRegistryTests(TestCase):
    def test_registry_entries_explicitly_classify_personal_data_and_art9(self):
        for label, metadata in VIOLATION_WEIGHTS.items():
            self.assertIn("is_personal_data", metadata, label)
            self.assertIn("is_art_9", metadata, label)
            self.assertIs(type(metadata["is_personal_data"]), bool, label)
            self.assertIs(type(metadata["is_art_9"]), bool, label)

    def test_art9_violations_have_high_weight(self):
        for label, metadata in VIOLATION_WEIGHTS.items():
            if metadata.get("is_art_9") is True:
                self.assertEqual(metadata["weight"], 3, label)

    def test_art9_violations_are_always_personal_data(self):
        for label, metadata in VIOLATION_WEIGHTS.items():
            if metadata.get("is_art_9") is True:
                self.assertTrue(metadata["is_personal_data"], label)

    def test_personal_documents_are_not_art9(self):
        metadata = VIOLATION_WEIGHTS["Personal documents (IDs, passports, driving licenses)"]

        self.assertEqual(metadata["weight"], 2)
        self.assertEqual(metadata["article"], "Art. 6 GDPR")
        self.assertTrue(metadata["is_personal_data"])
        self.assertFalse(metadata["is_art_9"])

    def test_mixed_demographic_label_remains_conservative_art9_classification(self):
        metadata = VIOLATION_WEIGHTS[
            "Scan for sensitive demographic attributes (gender, race, religion) that could trigger unintended proxy bias"
        ]

        # Product simplification: this combined label should be split later,
        # because race and religion are Art. 9 while gender is not automatically Art. 9.
        self.assertTrue(metadata["is_personal_data"])
        self.assertTrue(metadata["is_art_9"])


class DataSourceRiskAssessmentServiceTests(TestCase):
    def test_art9_violation_sets_high_risk_and_art9_flag(self):
        data_source = DataSource(
            compliance_violations=["Voice recordings capable of identifying specific natural persons"],
        )

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "high")
        self.assertTrue(assessment["contains_personal_data"])
        self.assertTrue(assessment["contains_art9_data"])
        self.assertEqual(assessment["art_9_data"], "possible")

    def test_single_personal_data_violation_stays_low_but_flags_personal_data(self):
        # A single weight-1 finding scores below the medium threshold (2), so the
        # risk level stays low, but the personal-data flag must still be set.
        data_source = DataSource(
            compliance_violations=["License plates or vehicle identifiers"],
        )

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "low")
        self.assertTrue(assessment["contains_personal_data"])
        self.assertFalse(assessment["contains_art9_data"])

    def test_non_art9_cumulative_high_score_does_not_set_art9_flag(self):
        data_source = DataSource(
            compliance_violations=[
                "Names, surnames, and pseudonyms",
                "Email addresses and domain information",
                "Phone numbers and digital messaging handles",
            ],
        )

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "high")
        self.assertTrue(assessment["contains_personal_data"])
        self.assertFalse(assessment["contains_art9_data"])
        self.assertEqual(assessment["art_9_data"], "no")

    def test_general_compliance_violation_can_raise_risk_without_personal_data(self):
        data_source = DataSource(
            compliance_violations=[
                "Evaluate data completeness, identifying missing attributes or anomalies that degrade safety",
            ],
        )

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "medium")
        self.assertFalse(assessment["contains_personal_data"])
        self.assertFalse(assessment["contains_art9_data"])

    def test_multiple_general_violations_can_raise_high_risk_without_personal_data(self):
        data_source = DataSource(
            compliance_violations=[
                "Check if images were harvested via untargeted scraping",
                "Evaluate if dataset representation has demographic gaps or biases",
            ],
        )

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "high")
        self.assertFalse(assessment["contains_personal_data"])
        self.assertFalse(assessment["contains_art9_data"])

    def test_high_weight_without_art9_flag_does_not_set_art9_flag(self):
        label = "Synthetic high non-Art. 9 violation"
        VIOLATION_WEIGHTS[label] = {
            "weight": 3,
            "article": "Art. 6 GDPR",
            "is_personal_data": False,
            "is_art_9": False,
        }
        self.addCleanup(lambda: VIOLATION_WEIGHTS.pop(label, None))
        data_source = DataSource(compliance_violations=[label])

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "high")
        self.assertFalse(assessment["contains_personal_data"])
        self.assertFalse(assessment["contains_art9_data"])
        self.assertEqual(assessment["art_9_data"], "no")

    def test_unknown_violation_labels_do_not_set_score_or_flags(self):
        data_source = DataSource(
            compliance_violations=["Unknown compliance label"],
        )

        assessment = assess_data_source_risk(data_source)

        self.assertEqual(assessment["risk_level"], "low")
        self.assertEqual(assessment["violation_score"], 0)
        self.assertFalse(assessment["contains_personal_data"])
        self.assertFalse(assessment["contains_art9_data"])


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
        # A project containing ordinary personal data should be classified as medium risk
        # and return the corresponding recommendations.
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
        self.assertIn("Review and document the legal basis for processing personal data.",payload["recommendations"],)
        self.assertIn("Remove or pseudonymize direct identifiers that are not required.",payload["recommendations"],)

    def test_art9_or_high_risk_data_returns_red_risk_assessment(self):
        # Art. 9 data should elevate the project to high risk and include both the default high-risk recommendations
        # and Art. 9 guidance.
        project = Project.objects.create(name="Sensitive Data Project")
        DataSource.objects.create(
            project=project,
            name="Medical Notes",
            contains_personal_data=True,
            metadata={
                "risk_level": "red",
                "contains_art9_data": True,
                "data_category_keys": ["health_data"],
            },
        )

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["overall_status"], "red")
        self.assertEqual(payload["risk_level"], "high")
        self.assertEqual(payload["metrics"]["high_risk_sources"], 1)
        self.assertEqual(payload["metrics"]["art_9_sources"], 1)
        self.assertIn("Stop using the high-risk data for training until it has been reviewed.", payload["recommendations"],)
        self.assertIn("Check whether a Data Protection Impact Assessment is required.", payload["recommendations"],)
        self.assertIn("Review the handling of health data and confirm the GDPR Art. 9 exception.", payload["recommendations"],)
        self.assertIn("Confirm and document the legal exception for processing GDPR Art. 9 data.", payload["recommendations"],)

    def test_project_risk_response_omits_top_detected_data_categories(self):
        # The project risk endpoint should return risk metrics and recommendations
        # without exposing the deprecated top_detected_data_categories field.
        project = Project.objects.create(name="Category Project")
        DataSource.objects.create(
            project=project,
            name="Support Contacts",
            contains_personal_data=True,
            metadata={"risk_level": "medium"},
        )
        DataSource.objects.create(
            project=project,
            name="Patient Notes",
            contains_personal_data=True,
            metadata={"risk_level": "high", "contains_art9_data": True},
        )

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertNotIn("top_detected_data_categories", payload)
        self.assertEqual(payload["metrics"]["total_data_sources"], 2)
        self.assertEqual(payload["metrics"]["personal_data_sources"], 2)
        self.assertEqual(payload["metrics"]["high_risk_sources"], 1)
        self.assertEqual(payload["metrics"]["medium_risk_sources"], 1)
        self.assertEqual(payload["metrics"]["art_9_sources"], 1)

    def test_personal_data_sources_count_only_explicit_personal_data_violations(self):
        project = Project.objects.create(name="Mixed Risk Project")
        personal_source = DataSource(
            project=project,
            name="Traffic Feed",
            compliance_violations=["License plates or vehicle identifiers"],
        )
        apply_data_source_risk_assessment(personal_source)
        personal_source.save()
        general_risk_source = DataSource(
            project=project,
            name="Completeness Report",
            compliance_violations=[
                "Evaluate data completeness, identifying missing attributes or anomalies that degrade safety",
            ],
        )
        apply_data_source_risk_assessment(general_risk_source)
        general_risk_source.save()

        response = self.client.get(self.risk_url(project))

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["metrics"]["total_data_sources"], 2)
        self.assertEqual(payload["metrics"]["personal_data_sources"], 1)
        # The license plate (weight 1) now stays low; only the weight-2 Art. 10
        # completeness finding reaches medium risk.
        self.assertEqual(payload["metrics"]["medium_risk_sources"], 1)

    def test_missing_project_returns_404(self):
        response = self.client.get(
            reverse("project-risk-assessment", kwargs={"project_id": 9999})
        )

        self.assertEqual(response.status_code, 404)
