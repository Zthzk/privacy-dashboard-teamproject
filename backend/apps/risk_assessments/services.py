"""Risk assessment services for data sources and projects.

This module converts selected compliance violations into data-source risk
metadata and aggregates those results into a project-level privacy status.
"""

from .violation_weights import VIOLATION_WEIGHTS


RISK_LEVELS = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
}

RISK_STATUS_DISPLAY = {
    "green": "Low Risk",
    "yellow": "Medium Risk",
    "red": "High Risk",
}

RISK_LEVEL_DISPLAY = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
}

# Default project recommendations shown for each overall risk level.
# Additional recommendations may be appended later based on specific conditions such as GDPR Art. 9 data.
RECOMMENDATIONS_BY_STATUS = {
    "yellow": [
        "Review and document the legal basis for processing personal data.",
        "Remove or pseudonymize direct identifiers that are not required.",
        "Limit access to the personal data sources to necessary team members only.",
    ],
    "red": [
        "Stop using the high-risk data for training until it has been reviewed.",
        "Check whether a Data Protection Impact Assessment is required.",
        "Document safeguards such as access control, encryption, and pseudonymization.",
    ],
    "green": [
        "Keep the data source metadata up to date and review it when sources change.",
    ],
}

# The score and Art. 9 classification are intentionally separate: several
# lower-weight non-Art. 9 violations may also produce a high total score.
VIOLATION_HIGH_THRESHOLD = 3

# A single standard personal-data finding (weight 1) is not enough for medium
# risk on its own; medium requires either two such findings or one elevated
# (weight 2) violation.
VIOLATION_MEDIUM_THRESHOLD = 2


def score_compliance_violations(violations):
    """Return the total weight of all recognized compliance violations.

    Unknown labels are ignored so that stale or newly introduced checklist
    values do not cause the assessment to fail.

    Args:
        violations: An iterable of compliance-violation labels.

    Returns:
        The sum of the configured weights for all recognized labels.
    """
    return sum(
        VIOLATION_WEIGHTS[violation]["weight"]
        for violation in violations
        if violation in VIOLATION_WEIGHTS
    )


def _has_art_9_compliance_violation(violations):
    """Return whether any recognized violation is marked as GDPR Art. 9."""
    return any(
        VIOLATION_WEIGHTS[violation].get("is_art_9") is True
        for violation in violations
        if violation in VIOLATION_WEIGHTS
    )


def _has_personal_data_compliance_violation(violations):
    """Return whether any recognized violation indicates personal data."""
    return any(
        VIOLATION_WEIGHTS[violation].get("is_personal_data") is True
        for violation in violations
        if violation in VIOLATION_WEIGHTS
    )


def assess_data_source_risk(data_source):
    """Assess a data source using its selected compliance violations.

    The function only reads from ``data_source`` and does not mutate it.

    Args:
        data_source: A data-source object with a ``compliance_violations``
            attribute.

    Returns:
        A dictionary containing the detected data flags, normalized risk
        level, human-readable reason, and cumulative violation score.
    """
    violations = data_source.compliance_violations or []
    violation_score = score_compliance_violations(violations)
    contains_art_9_data = _has_art_9_compliance_violation(violations)
    contains_personal_data = _has_personal_data_compliance_violation(violations)

    if violation_score >= VIOLATION_HIGH_THRESHOLD:
        risk_level = "high"
        if contains_art_9_data:
            reason = (
                "Compliance violations indicate the presence of GDPR Art. 9 "
                "special category data."
            )
        elif contains_personal_data:
            reason = "Compliance violations indicate elevated personal data risk."
        else:
            reason = "Compliance violations indicate elevated compliance risk."
    elif violation_score >= VIOLATION_MEDIUM_THRESHOLD:
        risk_level = "medium"
        if contains_personal_data:
            reason = (
                "Compliance violations indicate the presence of personal data."
            )
        else:
            reason = (
                "Compliance violations indicate compliance risk requiring review."
            )
    else:
        risk_level = "low"
        reason = "No recognized compliance violations are currently selected."

    return {
        "contains_personal_data": contains_personal_data,
        "contains_art9_data": contains_art_9_data,
        "art_9_data": "possible" if contains_art_9_data else "no",
        "risk_level": risk_level,
        "risk_reason": reason,
        "violation_score": violation_score,
    }


def apply_data_source_risk_assessment(data_source):
    """Assess a data source and store the result on the same object.

    The object is updated in place, but this function does not save it to the
    database.

    Args:
        data_source: The data-source object to assess and update.

    Returns:
        The mutated ``data_source`` object.
    """
    assessment = assess_data_source_risk(data_source)
    data_source.contains_personal_data = assessment["contains_personal_data"]

    # Preserve unrelated metadata while replacing the generated risk fields.
    data_source.metadata = {
        **(data_source.metadata or {}),
        "art_9_data": assessment["art_9_data"],
        "contains_art9_data": assessment["contains_art9_data"],
        "risk_level": assessment["risk_level"],
        "risk_reason": assessment["risk_reason"],
        "violation_score": assessment["violation_score"],
    }
    return data_source


def normalize_risk_level(data_source):
    """Return a canonical ``low``, ``medium``, or ``high`` risk level.

    Legacy traffic-light values are supported for data sources assessed by an
    older version of the application. Missing risk metadata falls back to the
    stored personal-data flag.

    Args:
        data_source: A data-source object with ``metadata`` and
            ``contains_personal_data`` attributes.

    Returns:
        One of ``"low"``, ``"medium"``, or ``"high"``.
    """
    risk_level = (data_source.metadata or {}).get("risk_level")

    if risk_level in {"high", "red"}:
        return "high"
    if risk_level in {"medium", "yellow"}:
        return "medium"
    if risk_level in {"low", "green"}:
        return "low"
    if data_source.contains_personal_data:
        return "medium"
    return "low"


def contains_art_9_data(data_source):
    """Return whether stored metadata indicates GDPR Art. 9 data.

    Both current and legacy metadata representations are accepted.

    Args:
        data_source: A data-source object with a ``metadata`` attribute.

    Returns:
        ``True`` when the metadata indicates special-category data; otherwise
        ``False``.
    """
    metadata = data_source.metadata or {}
    art_9_data = metadata.get("art_9_data")
    contains_art9_data = metadata.get("contains_art9_data")

    if contains_art9_data is True:
        return True
    if art_9_data in {"yes", "possible", True}:
        return True
    return False


def calculate_project_risk(project):
    """Aggregate data-source risks into a project-level assessment.

    Args:
        project: A project object whose ``data_sources`` relation provides an
            ``all()`` method.

    Returns:
        A dictionary containing the traffic-light status, normalized risk
        level, explanation, metrics, and recommended actions.
    """
    data_sources = list(project.data_sources.all())
    risk_levels = [
        normalize_risk_level(data_source)
        for data_source in data_sources
    ]

    metrics = {
        # Aggregate project-level metrics from all data sources.
        # These values drive both the overall traffic-light status and the summary cards displayed in the frontend.
        "total_data_sources": len(data_sources),
        "personal_data_sources": sum(
            1
            for data_source in data_sources
            if data_source.contains_personal_data
        ),
        "high_risk_sources": risk_levels.count("high"),
        "medium_risk_sources": risk_levels.count("medium"),
        "art_9_sources": sum(
            1
            for data_source in data_sources
            if contains_art_9_data(data_source)
        ),
    }

    # Project status follows the most severe condition found in its sources.
    if metrics["total_data_sources"] == 0:
        overall_status = "green"
        reason = "No data sources have been added yet."

    elif metrics["high_risk_sources"] > 0 or metrics["art_9_sources"] > 0:
        # Projects containing GDPR Art. 9 data require additional compliance guidance beyond
        # the default high-risk actions.
        overall_status = "red"
        reason = (
            "At least one data source is high risk or contains GDPR Art. 9 "
            "special category data."
    )

    elif metrics["personal_data_sources"] > 0 or metrics["medium_risk_sources"] > 0:
        overall_status = "yellow"
        reason = (
            "At least one data source contains personal data or has medium "
            "risk level."
    )

    else:
        overall_status = "green"
        reason = "No personal data or high-risk sources are currently detected."

    # Copy the default recommendation list for the calculated status.
    # A copy is created so additional context-specific recommendations can be appended
    # without modifying the shared defaults.
    recommendations = list(RECOMMENDATIONS_BY_STATUS[overall_status])

    if overall_status == "red" and metrics["art_9_sources"] > 0:
        recommendations.append(
            "Review the handling of health data and confirm the GDPR Art. 9 exception."
        )
        recommendations.append(
            "Confirm and document the legal exception for processing GDPR Art. 9 data."
        )

    return {
        "project_id": project.id,
        "overall_status": overall_status,
        "overall_status_display": RISK_STATUS_DISPLAY[overall_status],
        "risk_level": {
            "green": "low",
            "yellow": "medium",
            "red": "high",
        }[overall_status],
        "risk_level_display": {
            "green": RISK_LEVEL_DISPLAY["low"],
            "yellow": RISK_LEVEL_DISPLAY["medium"],
            "red": RISK_LEVEL_DISPLAY["high"],
        }[overall_status],
        "reason": reason,
        "metrics": metrics,
        "recommendations": recommendations,
    }


