from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Project

@override_settings(ROOT_URLCONF='config.urls')
class ProjectAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/projects/"
        self.valid_data = {
            "name": "Demo Project",
            "description": "Short project description"
        }

    
    # POST /api/projects/
   

    def test_create_project_success(self):
        response = self.client.post(self.url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Demo Project")
        self.assertEqual(response.data["description"], "Short project description")
        self.assertIn("id", response.data)
        self.assertIn("created_at", response.data)
        self.assertIn("updated_at", response.data)

    def test_create_project_without_description(self):
        response = self.client.post(self.url, {"name": "No Desc"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["description"], "")

    def test_create_project_missing_name(self):
        response = self.client.post(self.url, {"description": "No name"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_create_project_empty_name(self):
        response = self.client.post(self.url, {"name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    
    # GET /api/projects/
   

    def test_get_projects_empty(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_projects_returns_list(self):
        Project.objects.create(name="Project A", description="Desc A")
        Project.objects.create(name="Project B", description="Desc B")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_projects_correct_fields(self):
        Project.objects.create(name="Project A", description="Desc A")
        response = self.client.get(self.url)
        project = response.data[0]
        self.assertIn("id", project)
        self.assertIn("name", project)
        self.assertIn("description", project)
        self.assertIn("created_at", project)
        self.assertIn("updated_at", project)