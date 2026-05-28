from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from apps.projects.models import Project
from apps.risk_assessments.services import calculate_project_risk


@require_http_methods(["GET"])
def project_risk_assessment(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

    return JsonResponse(calculate_project_risk(project))
