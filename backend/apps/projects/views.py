import json

from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Project


@api_view(["GET"])
def health_check(request):
    return Response({
        "message": "Privacy Dashboard backend is running"
    })


def serialize_project(project):
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "status_display": project.get_status_display(),
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
        return JsonResponse({
            "projects": [
                serialize_project(project)
                for project in Project.objects.all()
            ]
        })

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
@require_http_methods(["PATCH", "DELETE"])
def project_detail(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

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
    if "status" in payload:
        project.status = payload.get("status", project.status)

    try:
        project.full_clean()
        project.save()
    except ValidationError as error:
        return json_error(
            "Project validation failed.",
            errors=error.message_dict,
        )

    return JsonResponse(serialize_project(project))
