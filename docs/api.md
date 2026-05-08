
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
  "overall_status": "green",
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
### GET `/projects/{project_id}/data-sources/`
Returns all data sources belonging to one project.

### POST `/projects/{project_id}/data-sources/`
Creates a data source for one project.

Request:
```
{
  "name": "Customer emails",
  "source_type": "text",
  "description": "Text dataset containing support emails",
  "contains_personal_data": true,
  "contains_art9_data": false,
  "preview_text": "Example row or text preview"
}
```

Response:
```
{
  "id": 1,
  "project": 1,
  "name": "Customer emails",
  "source_type": "text",
  "description": "Text dataset containing support emails",
  "contains_personal_data": true,
  "contains_art9_data": false,
  "risk_level": "yellow",
  "preview_text": "Example row or text preview"
}
```

### GET `/data-sources/{id}/`
Returns one data source.

### PATCH `/data-sources/{id}/`
Updates one data source.

### DELETE `/data-sources/{id}/`
Deletes one data source.

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
      "source_type": "text",
      "contains_personal_data": true,
      "contains_art9_data": true,
      "preview_text": "Example medical note"
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
- overall risk status
- data source list
- personal data status
- Art. 9 GDPR status
- recommendations
- generation date
