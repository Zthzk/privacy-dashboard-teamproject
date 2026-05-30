import re


RISK_LEVELS = {
    "low": "Low",
    "medium": "Medium",
    "high": "High",
}

DATA_CATEGORY_DEFINITIONS = {
    "contact_data": {
        "label": "Contact Data",
        "group": "personal_data",
        "is_art_9": False,
    },
    "direct_identifiers": {
        "label": "Direct Identifiers",
        "group": "personal_data",
        "is_art_9": False,
    },
    "location_data": {
        "label": "Location Data",
        "group": "personal_data",
        "is_art_9": False,
    },
    "online_identifiers": {
        "label": "Online Identifiers",
        "group": "personal_data",
        "is_art_9": False,
    },
    "financial_data": {
        "label": "Financial Data",
        "group": "personal_data",
        "is_art_9": False,
    },
    "health_data": {
        "label": "Health Data",
        "group": "art_9",
        "is_art_9": True,
    },
    "biometric_genetic_data": {
        "label": "Biometric / Genetic Data",
        "group": "art_9",
        "is_art_9": True,
    },
    "other_art_9_data": {
        "label": "Other Art. 9 Data",
        "group": "art_9",
        "is_art_9": True,
    },
}

DATA_CATEGORY_ORDER = list(DATA_CATEGORY_DEFINITIONS.keys())

DATA_CATEGORY_PRIORITY = {
    "health_data": 90,
    "biometric_genetic_data": 90,
    "other_art_9_data": 85,
    "financial_data": 80,
    "direct_identifiers": 75,
    "contact_data": 70,
    "location_data": 60,
    "online_identifiers": 55,
}

PERSONAL_DATA_TO_DATA_CATEGORY = {
    "address": ["contact_data", "location_data"],
    "date_of_birth": ["direct_identifiers"],
    "email": ["contact_data"],
    "financial": ["financial_data"],
    "identifier": ["direct_identifiers"],
    "ip_address": ["online_identifiers"],
    "location": ["location_data"],
    "name": ["direct_identifiers"],
    "online_identifier": ["online_identifiers"],
    "phone": ["contact_data"],
}

ART_9_TO_DATA_CATEGORY = {
    "biometric": ["biometric_genetic_data"],
    "genetic": ["biometric_genetic_data"],
    "health": ["health_data"],
    "political_opinion": ["other_art_9_data"],
    "religion": ["other_art_9_data"],
    "sexual_orientation": ["other_art_9_data"],
    "trade_union": ["other_art_9_data"],
}

ART_9_KEYWORDS = {
    "biometric": [
        "biometric",
        "fingerprint",
        "face recognition",
        "facial recognition",
    ],
    "genetic": [
        "genetic",
        "dna",
        "genome",
    ],
    "health": [
        "diagnosis",
        "disease",
        "health",
        "hospital",
        "medical",
        "medication",
        "patient",
        "therapy",
    ],
    "political_opinion": [
        "political opinion",
        "political party",
        "voting",
    ],
    "religion": [
        "church",
        "faith",
        "religion",
        "religious",
    ],
    "sexual_orientation": [
        "sexual orientation",
    ],
    "trade_union": [
        "trade union",
        "union membership",
    ],
}

PERSONAL_DATA_KEYWORDS = {
    "address": [
        "address",
        "street",
        "postcode",
        "postal code",
    ],
    "date_of_birth": [
        "birth date",
        "date of birth",
        "dob",
    ],
    "identifier": [
        "customer id",
        "employee id",
        "national id",
        "passport",
        "user id",
    ],
    "ip_address": [
        "ip address",
    ],
    "name": [
        "first name",
        "last name",
        "full name",
        "name:",
    ],
    "email": [
        "email:",
        "email address",
    ],
    "financial": [
        "bank account",
        "credit card",
        "iban",
        "payment",
    ],
    "location": [
        "city",
        "gps",
        "latitude",
        "longitude",
    ],
    "online_identifier": [
        "cookie",
        "device id",
        "session id",
    ],
    "phone": [
        "phone",
        "telephone",
        "mobile",
    ],
}

PERSONAL_DATA_PATTERNS = {
    "email": re.compile(r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b"),
    "financial": re.compile(r"\b(?:\d[ -]*?){13,19}\b"),
    "ip_address": re.compile(
        r"\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}"
        r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b"
    ),
    "phone": re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)"),
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


def _flatten_metadata_value(value):
    if isinstance(value, dict):
        return " ".join(_flatten_metadata_value(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(_flatten_metadata_value(item) for item in value)
    if value is None:
        return ""
    return str(value)


def _build_assessment_text(data_source):
    return " ".join(
        [
            data_source.name or "",
            data_source.description or "",
            data_source.location or "",
            data_source.source_type or "",
            data_source.data_format or "",
            _flatten_metadata_value(data_source.metadata or {}),
        ]
    ).lower()


def _matched_keyword_categories(text, category_keywords):
    categories = []
    for category, keywords in category_keywords.items():
        if any(keyword in text for keyword in keywords):
            categories.append(category)
    return categories


def _matched_pattern_categories(text):
    return [
        category
        for category, pattern in PERSONAL_DATA_PATTERNS.items()
        if pattern.search(text)
    ]


def _serialize_data_category(key):
    definition = DATA_CATEGORY_DEFINITIONS[key]
    return {
        "key": key,
        "label": definition["label"],
        "group": definition["group"],
        "is_art_9": definition["is_art_9"],
    }


def _map_detected_categories(personal_categories, art_9_categories):
    category_keys = set()

    for category in personal_categories:
        category_keys.update(PERSONAL_DATA_TO_DATA_CATEGORY.get(category, []))
    for category in art_9_categories:
        category_keys.update(ART_9_TO_DATA_CATEGORY.get(category, []))

    return [
        _serialize_data_category(key)
        for key in DATA_CATEGORY_ORDER
        if key in category_keys
    ]


def _data_category_keys_for_source(data_source):
    metadata = data_source.metadata or {}
    keys = metadata.get("data_category_keys")
    if isinstance(keys, list):
        return [key for key in keys if key in DATA_CATEGORY_DEFINITIONS]

    categories = metadata.get("data_categories")
    if isinstance(categories, list):
        category_keys = []
        for category in categories:
            if isinstance(category, dict):
                key = category.get("key")
            else:
                key = category
            if key in DATA_CATEGORY_DEFINITIONS:
                category_keys.append(key)
        if category_keys:
            return category_keys

    return [
        category["key"]
        for category in _map_detected_categories(
            metadata.get("personal_data_categories", []),
            metadata.get("art_9_categories", []),
        )
    ]


def _sort_detected_data_categories(categories):
    return sorted(
        categories,
        key=lambda category: (
            -(category.get("source_count") or 0),
            -DATA_CATEGORY_PRIORITY.get(category["key"], 0),
            DATA_CATEGORY_ORDER.index(category["key"]),
        ),
    )


def assess_data_source_risk(data_source):
    text = _build_assessment_text(data_source)
    personal_categories = sorted(
        set(
            _matched_pattern_categories(text)
            + _matched_keyword_categories(text, PERSONAL_DATA_KEYWORDS)
        )
    )
    art_9_categories = sorted(set(_matched_keyword_categories(text, ART_9_KEYWORDS)))

    contains_art_9_data = bool(art_9_categories)
    contains_personal_data = (
        bool(personal_categories)
        or contains_art_9_data
        or data_source.contains_personal_data
    )
    data_categories = _map_detected_categories(personal_categories, art_9_categories)

    if contains_art_9_data:
        risk_level = "high"
        reason = "This data source may contain GDPR Art. 9 special category data."
    elif contains_personal_data:
        risk_level = "medium"
        reason = "This data source may contain personal data."
    else:
        risk_level = "low"
        reason = "No obvious personal data indicators were detected."

    return {
        "contains_personal_data": contains_personal_data,
        "contains_art9_data": contains_art_9_data,
        "art_9_data": "possible" if contains_art_9_data else "no",
        "art_9_categories": art_9_categories,
        "personal_data_categories": personal_categories,
        "data_categories": data_categories,
        "data_category_keys": [category["key"] for category in data_categories],
        "risk_level": risk_level,
        "risk_reason": reason,
    }


def apply_data_source_risk_assessment(data_source):
    assessment = assess_data_source_risk(data_source)
    data_source.contains_personal_data = assessment["contains_personal_data"]
    data_source.metadata = {
        **(data_source.metadata or {}),
        "art_9_data": assessment["art_9_data"],
        "art_9_categories": assessment["art_9_categories"],
        "contains_art9_data": assessment["contains_art9_data"],
        "personal_data_categories": assessment["personal_data_categories"],
        "data_categories": assessment["data_categories"],
        "data_category_keys": assessment["data_category_keys"],
        "risk_level": assessment["risk_level"],
        "risk_reason": assessment["risk_reason"],
    }
    return data_source


def normalize_risk_level(data_source):
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
    metadata = data_source.metadata or {}
    art_9_data = metadata.get("art_9_data")
    contains_art9_data = metadata.get("contains_art9_data")

    if contains_art9_data is True:
        return True
    if art_9_data in {"yes", "possible", True}:
        return True
    return False


def calculate_project_risk(project):
    data_sources = list(project.data_sources.all())
    risk_levels = [normalize_risk_level(data_source) for data_source in data_sources]
    category_counts = {}

    for data_source in data_sources:
        for key in set(_data_category_keys_for_source(data_source)):
            category_counts[key] = category_counts.get(key, 0) + 1

    top_detected_data_categories = _sort_detected_data_categories([
        {
            **_serialize_data_category(key),
            "source_count": category_counts[key],
        }
        for key in DATA_CATEGORY_ORDER
        if category_counts.get(key)
    ])

    metrics = {
        "total_data_sources": len(data_sources),
        "personal_data_sources": sum(
            1 for data_source in data_sources if data_source.contains_personal_data
        ),
        "high_risk_sources": risk_levels.count("high"),
        "medium_risk_sources": risk_levels.count("medium"),
        "art_9_sources": sum(
            1 for data_source in data_sources if contains_art_9_data(data_source)
        ),
    }

    if metrics["total_data_sources"] == 0:
        overall_status = "green"
        reason = "No data sources have been added yet."
        recommendations = [
            "Add data sources to start the privacy risk assessment.",
        ]
    elif metrics["high_risk_sources"] > 0 or metrics["art_9_sources"] > 0:
        overall_status = "red"
        reason = "At least one data source is high risk or contains GDPR Art. 9 special category data."
        recommendations = [
            "Review high-risk and Art. 9 data sources before model training.",
            "Check whether a DPIA is required for this processing activity.",
            "Document safeguards and access restrictions for sensitive data.",
        ]
    elif metrics["personal_data_sources"] > 0 or metrics["medium_risk_sources"] > 0:
        overall_status = "yellow"
        reason = "At least one data source contains personal data or has medium risk level."
        recommendations = [
            "Review legal basis for processing and ensure documentation is up to date.",
            "Minimize directly identifying attributes where possible.",
            "Document the processing purpose for each personal data source.",
        ]
    else:
        overall_status = "green"
        reason = "No personal data or high-risk categories are currently detected."
        recommendations = [
            "Keep data source metadata documented and review it when sources change.",
        ]

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
        "top_detected_data_categories": top_detected_data_categories,
        "recommendations": recommendations,
    }
