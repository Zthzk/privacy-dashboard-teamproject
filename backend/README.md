# Backend

This folder contains the Django backend for the privacy dashboard team project.

## Requirements

- Python 3.14 or newer
- uv

## Setup

From the repository root:

```bash
cd backend
uv sync
uv run python manage.py migrate
```

## Run the Development Server

```bash
cd backend
uv run python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000/`.

## Run Tests

```bash
cd backend
uv run python manage.py test
```

To run only the data source tests:

```bash
cd backend
uv run python manage.py test datasources
```

## US-02: Data Sources

US-02 adds backend support for attaching data sources to projects.

Implemented scope:

- Store data sources per project.
- List all data sources for one project.
- Create a data source for one project.
- Validate basic JSON input, field choices, duplicate names per project, and unknown projects.
- Manage projects and data sources through Django admin.

Not included in this backend story:

- Frontend UI.
- Authentication and permissions.
- Updating or deleting data sources.
- File upload or live connection to external data systems.

## API Endpoints

### List Project Data Sources

```http
GET /api/projects/<project_id>/datasources/
```

Example response:

```json
{
  "project": {
    "id": 1,
    "name": "Privacy Dashboard"
  },
  "data_sources": []
}
```

### Create Project Data Source

```http
POST /api/projects/<project_id>/datasources/
Content-Type: application/json
```

Example request:

```json
{
  "name": "Customer CSV",
  "source_type": "file",
  "data_format": "csv",
  "description": "Synthetic customer dataset",
  "location": "datasets/customers.csv",
  "contains_personal_data": true,
  "metadata": {
    "columns": ["email", "name"]
  }
}
```

Supported `source_type` values:

- `file`
- `database`
- `api`
- `url`
- `manual`
- `other`

Supported `data_format` values:

- `text`
- `image`
- `csv`
- `json`
- `other`

Within the same project, data source names must be unique.
