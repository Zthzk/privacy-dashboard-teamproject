import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from projects.models import Project
from .models import DataSource


def serialize_data_source(data_source):
    return {
        "id": data_source.id,
        "project": data_source.project_id,
        "name": data_source.name,
        "source_type": data_source.source_type,
        "source_type_display": data_source.get_source_type_display(),
        "data_format": data_source.data_format,
        "data_format_display": data_source.get_data_format_display(),
        "description": data_source.description,
        "location": data_source.location,
        "contains_personal_data": data_source.contains_personal_data,
        "metadata": data_source.metadata,
        "last_scanned_at": (
            data_source.last_scanned_at.isoformat()
            if data_source.last_scanned_at
            else None
        ),
        "created_at": data_source.created_at.isoformat(),
        "updated_at": data_source.updated_at.isoformat(),
    }


def json_error(message, status=400, errors=None):
    payload = {"error": message}
    if errors:
        payload["errors"] = errors
    return JsonResponse(payload, status=status)


def parse_json_body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def project_data_sources(request, project_id):
    project = get_object_or_404(Project, pk=project_id)

    if request.method == "GET":
        data_sources = project.data_sources.all()
        return JsonResponse(
            {
                "project": {
                    "id": project.id,
                    "name": project.name,
                },
                "data_sources": [
                    serialize_data_source(data_source)
                    for data_source in data_sources
                ],
            }
        )

    payload = parse_json_body(request)
    if payload is None:
        return json_error("Invalid JSON body.")
    if not isinstance(payload, dict):
        return json_error("JSON body must be an object.")

    metadata = payload.get("metadata", {})
    if metadata is None:
        metadata = {}
    if not isinstance(metadata, dict):
        return json_error("metadata must be a JSON object.")

    contains_personal_data = payload.get("contains_personal_data", False)
    if not isinstance(contains_personal_data, bool):
        return json_error("contains_personal_data must be a boolean.")

    data_source = DataSource(
        project=project,
        name=payload.get("name", ""),
        source_type=payload.get("source_type", DataSource.SourceType.FILE),
        data_format=payload.get("data_format", DataSource.DataFormat.TEXT),
        description=payload.get("description", ""),
        location=payload.get("location", ""),
        contains_personal_data=contains_personal_data,
        metadata=metadata,
    )

    try:
        data_source.full_clean()
        data_source.save()
    except ValidationError as error:
        return json_error(
            "Data source validation failed.",
            errors=error.message_dict,
        )
    except IntegrityError:
        return json_error(
            "A data source with this name already exists in this project."
        )

    return JsonResponse(serialize_data_source(data_source), status=201)
