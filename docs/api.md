
# API Documentation

This document describes the planned API structure.

Base backend URL during development:

```text
http://127.0.0.1:8000/api
```

## Health Check
### GET `/health/`
Checks whether the backend is running.

Response:
```
{
  "message": "Privacy Dashboard backend is running"
}
```

### Authentication
Planned endpoints:
```
POST /auth/register/
POST /auth/login/
POST /auth/refresh/
POST /auth/logout/
```

Login response should return an access token.

## Projects
### GET `/projects/`
Returns all projects visible to the current user.
```
POST /projects/
```

Creates a new project.

Request:
```
{
  "name": "Medical Dataset Review",
  "description": "Privacy assessment for a medical ML pipeline"
}
```

Response:
```
{
  "id": 1,
  "name": "Medical Dataset Review",
  "description": "Privacy assessment for a medical ML pipeline",
  "data_sources_count": 0,
  "created_at": "2026-05-06T10:00:00Z",
  "updated_at": "2026-05-06T10:00:00Z"
}
```

### GET `/projects/{id}/`
Returns one project with details.

### PATCH `/projects/{id}/`
Updates a project.

### DELETE `/projects/{id}/`
Deletes a project.

## Data Sources
### GET `/datasources/`
Returns all data sources across projects.

### GET `/projects/{project_id}/datasources/`
Returns all data sources belonging to one project.

### POST `/projects/{project_id}/datasources/`
Creates a data source for one project.

Request:
```
{
  "name": "Customer emails",
  "source_type": "manual",
  "data_format": "text",
  "location": "manual input",
  "metadata": {
    "manual_data": "Example customer note"
  }
}
```

Response:
```
{
  "id": 1,
  "project": 1,
  "name": "Customer emails",
  "source_type": "manual",
  "source_type_display": "Manual",
  "data_format": "text",
  "data_format_display": "Text",
  "location": "manual input",
  "metadata": {
    "manual_data": "Example customer note"
  },
  "current_version_number": 1,
  "created_at": "2026-05-06T10:00:00Z",
  "updated_at": "2026-05-06T10:00:00Z"
}
```

### GET `/projects/{project_id}/datasources/{data_source_id}/`
Returns one data source.

### PATCH `/projects/{project_id}/datasources/{data_source_id}/`
Updates one data source.

### DELETE `/projects/{project_id}/datasources/{data_source_id}/`
Deletes one data source.

Deleting a data source also deletes its version history.

### GET `/projects/{project_id}/datasources/{data_source_id}/versions/`
Returns immutable historical snapshots for the current data source.

Versions are returned newest first. Version numbers are assigned by the backend.

Response:
```
{
  "data_source": 1,
  "project": 1,
  "versions": [
    {
      "id": 2,
      "data_source": 1,
      "project": 1,
      "version_number": 2,
      "name": "Customer emails updated",
      "source_type": "manual",
      "source_type_display": "Manual",
      "data_format": "text",
      "data_format_display": "Text",
      "description": "",
      "location": "manual input",
      "contains_personal_data": true,
      "risk_level": "medium",
      "risk_level_display": "Medium",
      "art_9_data": "no",
      "art_9_data_display": "No",
      "contains_art9_data": false,
      "metadata": {
        "manual_data": "Email: anna@example.com",
        "risk_level": "medium"
      },
      "compliance_violations": [],
      "last_scanned_at": "2026-05-06T10:10:00Z",
      "created_at": "2026-05-06T10:10:00Z"
    }
  ]
}
```

### GET `/projects/{project_id}/datasources/{data_source_id}/versions/{version_number}/`
Returns one immutable data source version snapshot.

Historical risk fields are snapshots. They are not recalculated when the current risk assessment logic changes.

If a data source is moved to another project, the same data source keeps its complete version lineage. The history is available through the data source's current project route.

## Risk Assessment
### GET `/projects/{id}/risk-assessment/`
Returns project-level risk information.

Example response:
```
{
  "project_id": 1,
  "overall_status": "yellow",
  "reason": "At least one data source contains personal data.",
  "recommendations": [
    "Review legal basis for processing.",
    "Minimize directly identifying attributes.",
    "Document the processing purpose."
  ]
}
```

## JSON Import
Planned endpoint:
```
POST /projects/{id}/import-json/
```

Example request body:
```
{
  "data_sources": [
    {
      "name": "Patient notes",
      "source_type": "manual",
      "data_format": "text",
      "location": "manual input",
      "metadata": {
        "manual_data": "Example medical note"
      }
    }
  ]
}
```

## Reports
Planned endpoint:

### GET `/projects/{id}/report.pdf`
The report should include:

- project name
- project description
- data source list
- generation date
