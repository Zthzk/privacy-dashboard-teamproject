import json

from django.core.exceptions import ValidationError
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.risk_assessments.services import calculate_project_risk

from .models import Project


@api_view(["GET"])
def health_check(request):
    return Response({"message": "Privacy Dashboard backend is running"})


def serialize_project(project):
    # List views annotate this count; detail views fall back to the related manager.
    data_sources_count = getattr(project, "data_sources_count", None)
    if data_sources_count is None:
        data_sources_count = project.data_sources.count()

    risk_assessment = calculate_project_risk(project)
    metrics = risk_assessment["metrics"]

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "data_sources_count": data_sources_count,
        "overall_status": risk_assessment["overall_status"],
        "overall_status_display": risk_assessment["overall_status_display"],
        "risk_level": risk_assessment["risk_level"],
        "risk_level_display": risk_assessment["risk_level_display"],
        "personal_data_sources": metrics["personal_data_sources"],
        "high_risk_sources": metrics["high_risk_sources"],
        "medium_risk_sources": metrics["medium_risk_sources"],
        "art_9_sources": metrics["art_9_sources"],
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }


def json_error(message, status=400, errors=None):
    payload = {"error": message}
    if errors:
        payload["errors"] = errors
        payload.update(errors)
    return JsonResponse(payload, status=status)


def parse_json_body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def projects(request):
    if request.method == "GET":
        project_queryset = Project.objects.annotate(
            data_sources_count=Count("data_sources"),
        ).prefetch_related("data_sources")

        return JsonResponse(
            {
                "projects": [
                    serialize_project(project)
                    for project in project_queryset
                ],
            }
        )

    payload = parse_json_body(request)
    if payload is None:
        return json_error("Invalid JSON body.")
    if not isinstance(payload, dict):
        return json_error("JSON body must be an object.")

    project = Project(
        name=payload.get("name", ""),
        description=payload.get("description", ""),
    )

    try:
        project.full_clean()
        project.save()
    except ValidationError as error:
        return json_error(
            "Project validation failed.",
            errors=error.message_dict,
        )

    return JsonResponse(serialize_project(project), status=201)


@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE"])
def project_detail(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

    if request.method == "GET":
        return JsonResponse(serialize_project(project))

    if request.method == "DELETE":
        deleted_id = project.id
        project.delete()
        return JsonResponse({"deleted": deleted_id})

    payload = parse_json_body(request)
    if payload is None:
        return json_error("Invalid JSON body.")
    if not isinstance(payload, dict):
        return json_error("JSON body must be an object.")

    if "name" in payload:
        project.name = payload.get("name", "")
    if "description" in payload:
        project.description = payload.get("description", "")

    try:
        project.full_clean()
        project.save()
    except ValidationError as error:
        return json_error(
            "Project validation failed.",
            errors=error.message_dict,
        )

    return JsonResponse(serialize_project(project))


@require_http_methods(["GET"])
def project_overview(request, project_id):
    project = get_object_or_404(
        Project.objects.prefetch_related("data_sources"),
        pk=project_id,
    )

    # Import locally to avoid coupling project views to data source views at module load time.
    from apps.data_sources.views import serialize_data_source

    return JsonResponse(
        {
            "project": serialize_project(project),
            "data_sources": [
                serialize_data_source(data_source)
                for data_source in project.data_sources.all()
            ],
            "risk_assessment": calculate_project_risk(project),
        }
    )
