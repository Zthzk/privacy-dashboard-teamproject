"""HTTP views and serialization helpers for data sources and version history."""

import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from apps.projects.models import Project
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.risk_assessments.services import apply_data_source_risk_assessment

from apps.risk_assessments.violation_weights import VIOLATION_WEIGHTS

from .format_hints import DATA_FORMAT_HINTS
from .models import DataSource, DataSourceVersion

# Canonical API labels used for normalized data-source risk levels.
RISK_LABELS = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
}


# Reads the stored risk level from metadata and maps it to a canonical label key.
def normalize_risk_level(data_source):
    """Return a supported risk level for the current data source."""
    risk_level = (data_source.metadata or {}).get("risk_level")
    if risk_level in RISK_LABELS:
        return risk_level
    if data_source.contains_personal_data:
        return "medium"
    return "low"


# Normalises the art_9_data metadata value to one of the four expected string tokens.
def normalize_art_9_data(data_source):
    """Normalize the current Art. 9 assessment to a supported string value."""
    art_9_data = (data_source.metadata or {}).get("art_9_data")
    if isinstance(art_9_data, bool):
        return "possible" if art_9_data else "no"
    if art_9_data in {"possible", "yes", "no", "unknown"}:
        return art_9_data
    return "unknown"


# Centralised here so the frontend does not need to duplicate hint texts.
@require_http_methods(["GET"])
def data_format_hints(request):
    enriched = {}
    for fmt, hints in DATA_FORMAT_HINTS.items():
        enriched[fmt] = {
            **hints,
            "checklist": [
                {
                    "label": label,
                    **VIOLATION_WEIGHTS.get(
                        label,
                        {
                            "weight": 1,
                            "article": "Art. 6 GDPR",
                            "is_personal_data": False,
                            "is_art_9": False,
                        },
                    ),
                }
                for label in hints["checklist"]
            ],
        }
    return JsonResponse(enriched)


def latest_version_number(data_source):
    """Return the highest stored version number for a data source, if any."""
    annotated_latest_version_number = getattr(
        data_source,
        "current_version_number",
        None,
    )
    if annotated_latest_version_number is not None:
        return annotated_latest_version_number

    latest_version = data_source.versions.order_by("-version_number").first()
    if latest_version is None:
        return None
    return latest_version.version_number


# Converts a DataSource model instance to the dict returned in all API responses.
def serialize_data_source(data_source, include_project=False):
    """Convert a DataSource instance into an API response dictionary."""
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
        "compliance_violations": data_source.compliance_violations,
        "current_version_number": latest_version_number(data_source),
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


def normalize_version_risk_level(version):
    """Return a valid risk level for a data source version."""
    if version.risk_level in RISK_LABELS:
        return version.risk_level
    if version.contains_personal_data:
        return "medium"
    return "low"


def normalize_version_art_9_data(version):
    """Normalize the stored Art. 9 value to a supported string value."""
    if isinstance(version.art_9_data, bool):
        return "possible" if version.art_9_data else "no"
    if version.art_9_data in {"possible", "yes", "no", "unknown"}:
        return version.art_9_data
    return "unknown"


def serialize_data_source_version(version):
    """Convert a DataSourceVersion instance into an API response dictionary."""
    risk_level = normalize_version_risk_level(version)
    art_9_data = normalize_version_art_9_data(version)

    return {
        "id": version.id,
        "data_source": version.data_source_id,
        "project": version.data_source.project_id,
        "version_number": version.version_number,
        "name": version.name,
        "source_type": version.source_type,
        "source_type_display": version.get_source_type_display(),
        "data_format": version.data_format,
        "data_format_display": version.get_data_format_display(),
        "description": version.description,
        "location": version.location,
        "contains_personal_data": version.contains_personal_data,
        "risk_level": risk_level,
        "risk_level_display": RISK_LABELS[risk_level],
        "art_9_data": art_9_data,
        "art_9_data_display": art_9_data.replace("_", " ").title(),
        "contains_art9_data": version.contains_art9_data,
        "metadata": version.metadata,
        "compliance_violations": version.compliance_violations,
        "last_scanned_at": (
            version.last_scanned_at.isoformat()
            if version.last_scanned_at
            else None
        ),
        "created_at": version.created_at.isoformat(),
    }


def data_source_snapshot_values(data_source):
    """Return the current data source fields used to create a version snapshot."""
    metadata = data_source.metadata or {}
    return {
        "name": data_source.name,
        "source_type": data_source.source_type,
        "data_format": data_source.data_format,
        "description": data_source.description,
        "location": data_source.location,
        "contains_personal_data": data_source.contains_personal_data,
        "metadata": metadata,
        "compliance_violations": data_source.compliance_violations or [],
        "last_scanned_at": data_source.last_scanned_at,
        "risk_level": metadata.get("risk_level", ""),
        "art_9_data": metadata.get("art_9_data", ""),
        "contains_art9_data": metadata.get("contains_art9_data") is True,
    }


def version_matches_data_source(version, data_source):
    """Return whether a version snapshot matches the current data source state."""
    snapshot = data_source_snapshot_values(data_source)
    # last_scanned_at is intentionally excluded so scan timestamps alone do not
    # create a new historical version.
    comparable_fields = [
        "name",
        "source_type",
        "data_format",
        "description",
        "location",
        "contains_personal_data",
        "metadata",
        "compliance_violations",
        "risk_level",
        "art_9_data",
        "contains_art9_data",
    ]
    return all(getattr(version, field) == snapshot[field] for field in comparable_fields)


def create_data_source_version_snapshot(data_source, force=False):
    """
    Create and return an immutable version snapshot of a data source.

    If the latest version already matches the current data source, the existing version is
    returned unless force is True. The parent row is locked to prevent concurrent requests
    from assigning the same version number.
    """

    # Lock the parent row so concurrent requests cannot allocate the same
    # next version number.
    locked_data_source = DataSource.objects.select_for_update().get(pk=data_source.pk)
    latest_version = locked_data_source.versions.order_by("-version_number").first()

    if latest_version is not None and not force:
        if version_matches_data_source(latest_version, locked_data_source):
            return latest_version

    version_number = 1
    if latest_version is not None:
        version_number = latest_version.version_number + 1

    return DataSourceVersion.objects.create(
        data_source=locked_data_source,
        version_number=version_number,
        **data_source_snapshot_values(locked_data_source),
    )


@require_http_methods(["GET"])
def data_sources(request):
    """Return all data sources together with their project information."""
    return JsonResponse(
        {
            "data_sources": [
                serialize_data_source(data_source, include_project=True)
                for data_source in DataSource.objects.select_related("project")
                .annotate(current_version_number=Max("versions__version_number"))
                .all()
            ],
        }
    )


# Builds a consistent JSON error response, optionally including field-level validation errors.
def json_error(message, status=400, errors=None):
    """Build a consistent JSON error response for API validation failures."""
    payload = {"error": message}
    if errors:
        payload["errors"] = errors
        payload.update(errors)
    return JsonResponse(payload, status=status)


# Parses the request body as JSON, returning None on malformed input.
def parse_json_body(request):
    """Parse the request body as JSON, returning None for invalid JSON."""
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


# Validates and normalises the shared fields present in both POST and PATCH payloads.
def validate_data_source_payload(payload):
    """Validate and normalize shared fields used when creating a data source."""
    metadata = payload.get("metadata", {})
    if metadata is None:
        metadata = {}
    if not isinstance(metadata, dict):
        return None, json_error("metadata must be a JSON object.")

    return {
        "metadata": metadata,
    }, None


@csrf_exempt
@require_http_methods(["GET", "POST"])
def project_data_sources(request, project_id):
    """List a project\'s data sources or create a new assessed data source."""
    project = get_object_or_404(Project, pk=project_id)

    if request.method == "GET":
        data_sources = project.data_sources.annotate(
            current_version_number=Max("versions__version_number"),
        )
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

    compliance_violations = payload.get("compliance_violations", [])
    if not isinstance(compliance_violations, list):
        return json_error("compliance_violations must be a JSON array.")

    data_source = DataSource(
        project=project,
        name=payload.get("name", ""),
        source_type=payload.get("source_type", DataSource.SourceType.FILE),
        data_format=payload.get("data_format", DataSource.DataFormat.TEXT),
        description=payload.get("description", ""),
        location=payload.get("location", ""),
        metadata=normalized_payload["metadata"],
        compliance_violations=compliance_violations,
    )

    try:
        with transaction.atomic():
            apply_data_source_risk_assessment(data_source)
            data_source.last_scanned_at = timezone.now()
            data_source.full_clean()
            data_source.save()
            # Version 1 captures the assessed current state immediately on create.
            create_data_source_version_snapshot(data_source, force=True)
            create_notification(
                Notification.Type.DATA_SOURCE_CREATED,
                "Data source created",
                f'Data source "{data_source.name}" was added to "{project.name}".',
                f"/projects/{project.id}",
            )
            if normalize_risk_level(data_source) == "high":
                create_notification(
                    Notification.Type.HIGH_RISK_DETECTED,
                    "High-risk data source detected",
                    f'Data source "{data_source.name}" was assessed as high risk.',
                    f"/projects/{project.id}",
                )
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
    """Retrieve, partially update, or delete one project data source."""
    data_source = get_object_or_404(
        DataSource,
        pk=data_source_id,
        project_id=project_id,
    )

    if request.method == "GET":
        return JsonResponse(serialize_data_source(data_source, include_project=True))

    if request.method == "DELETE":
        deleted_id = data_source.id
        data_source_name = data_source.name
        project_name = data_source.project.name
        data_source.delete()
        create_notification(
            Notification.Type.DATA_SOURCE_DELETED,
            "Data source deleted",
            f'Data source "{data_source_name}" was deleted from "{project_name}".',
            f"/projects/{project_id}",
        )
        return JsonResponse({"deleted": deleted_id})

    payload = parse_json_body(request)
    if payload is None:
        return json_error("Invalid JSON body.")
    if not isinstance(payload, dict):
        return json_error("JSON body must be an object.")

    try:
        with transaction.atomic():
            data_source = get_object_or_404(
                DataSource.objects.select_for_update(),
                pk=data_source_id,
                project_id=project_id,
            )
            original_risk_level = normalize_risk_level(data_source)
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
            if "compliance_violations" in payload:
                compliance_violations = payload.get("compliance_violations")
                if not isinstance(compliance_violations, list):
                    return json_error("compliance_violations must be a JSON array.")
                data_source.compliance_violations = compliance_violations

            apply_data_source_risk_assessment(data_source)
            # Refresh the scan timestamp only when the versioned state changed.
            latest_version = data_source.versions.order_by("-version_number").first()
            if latest_version is None or not version_matches_data_source(
                    latest_version,
                    data_source,
            ):
                data_source.last_scanned_at = timezone.now()
            data_source.full_clean()
            data_source.save()
            # Append a snapshot only when versioned state actually changed.
            create_data_source_version_snapshot(data_source)
            if (
                original_risk_level != "high"
                and normalize_risk_level(data_source) == "high"
            ):
                create_notification(
                    Notification.Type.HIGH_RISK_DETECTED,
                    "High-risk data source detected",
                    f'Data source "{data_source.name}" is now high risk.',
                    f"/projects/{data_source.project_id}",
                )
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


@require_http_methods(["GET"])
def project_data_source_versions(request, project_id, data_source_id):
    """Return the complete version history for a project data source."""
    data_source = get_object_or_404(
        DataSource.objects.prefetch_related("versions"),
        pk=data_source_id,
        project_id=project_id,
    )

    return JsonResponse(
        {
            "data_source": data_source.id,
            "project": data_source.project_id,
            "versions": [
                serialize_data_source_version(version)
                for version in data_source.versions.all()
            ],
        }
    )


@require_http_methods(["GET"])
def project_data_source_version_detail(
        request,
        project_id,
        data_source_id,
        version_number,
):
    """Return one historical data-source version identified by its number."""
    data_source = get_object_or_404(
        DataSource,
        pk=data_source_id,
        project_id=project_id,
    )
    version = get_object_or_404(
        DataSourceVersion.objects.select_related("data_source"),
        data_source=data_source,
        version_number=version_number,
    )

    return JsonResponse(serialize_data_source_version(version))
