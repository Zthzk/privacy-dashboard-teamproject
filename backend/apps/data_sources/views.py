import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from apps.projects.models import Project
from apps.risk_assessments.services import apply_data_source_risk_assessment

from .models import DataSource


RISK_LABELS = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
}


def normalize_risk_level(data_source):
    risk_level = data_source.metadata.get("risk_level")
    if risk_level in RISK_LABELS:
        return risk_level
    if data_source.contains_personal_data:
        return "medium"
    return "low"


def normalize_art_9_data(data_source):
    art_9_data = data_source.metadata.get("art_9_data")
    if isinstance(art_9_data, bool):
        return "possible" if art_9_data else "no"
    if art_9_data in {"possible", "yes", "no", "unknown"}:
        return art_9_data
    return "unknown"


# Privacy hints shown in the frontend form when a user selects a data format.
# art9_risk marks formats that commonly contain Art. 9 GDPR special category data.
DATA_FORMAT_HINTS = {
    "image": {
        "hint": "Image datasets may contain faces, license plates, or other visual identifiers.",
        "art9_risk": True,  # Faces and biometric data fall under Art. 9 GDPR
        "suggested_categories": ["faces", "license_plates", "biometric_data"],
    },
    "text": {
        "hint": "Text datasets often contain names, email addresses, or other identifying information.",
        "art9_risk": False,
        "suggested_categories": ["names", "emails", "addresses"],
    },
    "csv": {
        "hint": "CSV datasets may contain structured personal data such as customer or employee records.",
        "art9_risk": False,
        "suggested_categories": ["names", "addresses", "IDs"],
    },
    "json": {
        "hint": "JSON datasets may contain nested personal data across multiple fields.",
        "art9_risk": False,
        "suggested_categories": ["names", "emails", "IDs"],
    },
    "audio": {
        "hint": "Audio datasets may contain voice recordings that can identify individuals.",
        "art9_risk": True,  # Voice is a biometric identifier under Art. 9 GDPR
        "suggested_categories": ["voice_data", "biometric_data"],
    },
    "video": {
        "hint": "Video datasets may contain faces, movements, or behavioral patterns that identify individuals.",
        "art9_risk": True,  # Facial and movement data are biometric identifiers under Art. 9 GDPR
        "suggested_categories": ["faces", "biometric_data", "behavioral_data"],
    },
    "other": {
        "hint": "Review this data source manually to identify any personal data it may contain.",
        "art9_risk": False,
        "suggested_categories": [],
    },
}


# Returns the hints config for all data formats.
# The frontend fetches this once on mount to avoid duplicating the hint texts in two places.
@require_http_methods(["GET"])
def data_format_hints(request):
    return JsonResponse(DATA_FORMAT_HINTS)


def serialize_data_source(data_source, include_project=False):
    risk_level = normalize_risk_level(data_source)
    art_9_data = normalize_art_9_data(data_source)

    payload = {
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
        "risk_level": risk_level,
        "risk_level_display": RISK_LABELS[risk_level],
        "art_9_data": art_9_data,
        "art_9_data_display": art_9_data.replace("_", " ").title(),
        "metadata": data_source.metadata,
        "last_scanned_at": (
            data_source.last_scanned_at.isoformat()
            if data_source.last_scanned_at
            else None
        ),
        "created_at": data_source.created_at.isoformat(),
        "updated_at": data_source.updated_at.isoformat(),
    }

    if include_project:
        payload["project_name"] = data_source.project.name

    return payload


@require_http_methods(["GET"])
def data_sources(request):
    return JsonResponse(
        {
            "data_sources": [
                serialize_data_source(data_source, include_project=True)
                for data_source in DataSource.objects.select_related("project").all()
            ],
        }
    )


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


def validate_data_source_payload(payload):
    metadata = payload.get("metadata", {})
    if metadata is None:
        metadata = {}
    if not isinstance(metadata, dict):
        return None, json_error("metadata must be a JSON object.")

    contains_personal_data = payload.get("contains_personal_data", False)
    if not isinstance(contains_personal_data, bool):
        return None, json_error("contains_personal_data must be a boolean.")

    return {
        "metadata": metadata,
        "contains_personal_data": contains_personal_data,
    }, None


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

    normalized_payload, error = validate_data_source_payload(payload)
    if error:
        return error

    data_source = DataSource(
        project=project,
        name=payload.get("name", ""),
        source_type=payload.get("source_type", DataSource.SourceType.FILE),
        data_format=payload.get("data_format", DataSource.DataFormat.TEXT),
        description=payload.get("description", ""),
        location=payload.get("location", ""),
        contains_personal_data=normalized_payload["contains_personal_data"],
        metadata=normalized_payload["metadata"],
    )

    try:
        apply_data_source_risk_assessment(data_source)
        data_source.last_scanned_at = timezone.now()
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

    return JsonResponse(serialize_data_source(data_source, include_project=True), status=201)


@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE"])
def project_data_source_detail(request, project_id, data_source_id):
    data_source = get_object_or_404(
        DataSource,
        pk=data_source_id,
        project_id=project_id,
    )

    if request.method == "GET":
        return JsonResponse(serialize_data_source(data_source, include_project=True))

    if request.method == "DELETE":
        deleted_id = data_source.id
        data_source.delete()
        return JsonResponse({"deleted": deleted_id})

    payload = parse_json_body(request)
    if payload is None:
        return json_error("Invalid JSON body.")
    if not isinstance(payload, dict):
        return json_error("JSON body must be an object.")

    if "project" in payload:
        data_source.project = get_object_or_404(Project, pk=payload.get("project"))
    if "name" in payload:
        data_source.name = payload.get("name", "")
    if "source_type" in payload:
        data_source.source_type = payload.get("source_type", data_source.source_type)
    if "data_format" in payload:
        data_source.data_format = payload.get("data_format", data_source.data_format)
    if "description" in payload:
        data_source.description = payload.get("description", "")
    if "location" in payload:
        data_source.location = payload.get("location", "")
    if "metadata" in payload:
        metadata = payload.get("metadata")
        if metadata is None:
            metadata = {}
        if not isinstance(metadata, dict):
            return json_error("metadata must be a JSON object.")
        data_source.metadata = metadata
    if "contains_personal_data" in payload:
        contains_personal_data = payload.get("contains_personal_data")
        if not isinstance(contains_personal_data, bool):
            return json_error("contains_personal_data must be a boolean.")
        data_source.contains_personal_data = contains_personal_data

    try:
        apply_data_source_risk_assessment(data_source)
        data_source.last_scanned_at = timezone.now()
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

    return JsonResponse(serialize_data_source(data_source, include_project=True))
