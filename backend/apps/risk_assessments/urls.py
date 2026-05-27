from django.urls import path

from . import views


urlpatterns = [
    path(
        "projects/<int:project_id>/risk-assessment/",
        views.project_risk_assessment,
        name="project-risk-assessment",
    ),
]
