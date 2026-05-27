# Architecture Overview
Explanation of the structure to help every team member understand where code should be placed and how frontend and backend development should work together.

## 1. High-Level Architecture

Our project uses a separated frontend/backend architecture.

```text
User Browser
    ↓
React Frontend
    ↓ HTTP requests with JSON
Django REST API
    ↓
Database
```
The frontend is for everything the user sees and interacts with. 

The backend is for storing data, handling business logic, calculating privacy risk, and returning API responses.

## 2. Root Project Structure
The project root should look like this:
```text
privacy-dashboard-teamproject/
├── frontend/
├── backend/
├── docs/
└── README.md
```

## 3. What Each Root Folder Means
### `frontend/ ` 
The frontend folder contains the React application.

This is where we build:

- pages
- forms
- buttons
- dashboard cards
- tables
- charts
- risk indicators
- login screens


In simple words:
```text
frontend = what the user sees in the browser
```

### `backend/`
The backend folder contains the Django REST API.

This is where we build:

- database models
- API endpoints
- authentication
- privacy risk rules
- JSON import logic
- PDF report logic

In simple words:
```text
backend = data, rules, and API
```

### `docs/`

The docs folder contains documentation for the team.

This is where we write:

- architecture explanations
- user story planning
- API documentation
- development workflow
- Definition of Done


In simple words:
```text
docs = shared project knowledge

```
### `README.md`
The `README.md` file is the first file people should read.

It should explain:

- what the project is
- which technologies we use
- how to start the backend
- how to start the frontend
- where to find more documentation


## 4. Frontend Structure
Recommended frontend structure:
```text
frontend/src/
├── app/
├── api/
├── features/
├── components/
└── styles/
```

## 5. Frontend Folder Responsibilities
### `frontend/src/app/`
This folder contains global application setup.

Use this folder for:

- main app setup
- routing
- global providers
- global layout setup


Do not put feature-specific logic here.

### `frontend/src/api/`
This folder contains functions that call the backend.

Use this folder for code like:
```text
getProjects()
createProject()
getDataSources()
login()
```

In simple words:
```text
src/api = frontend functions that talk to Django
```

### `frontend/src/features/`


This folder contains the main product features.

Recommended structure:
```text
features/
├── auth/
├── dashboard/
├── projects/
├── data-sources/
├── risk-assessments/
├── imports/
├── reports/
└── admin/
```

Each user story should usually belong to one of these feature folders.

Examples:
```text
US-01 Create Project -> features/projects/
US-02 Add Data Source -> features/data-sources/
US-04 Dashboard Overview -> features/dashboard/
US-05 Login -> features/auth/
```

### `frontend/src/components/`

This folder contains reusable UI components.

Examples:
```text
components/
├── layout/
├── ui/
└── charts/
```

Examples of reusable components:

- `RiskBadge`
- `TrafficLightCard`
- `DataSourceTable`
- `RecommendationBox`
- `DatasetPreview`


Use `components/` when a UI element can be reused in several places.

### `frontend/src/styles/`
This folder contains global styles and theme-related files.

Examples:

- global CSS
- color variables
- dark mode theme
- layout spacing rules


### `6. Backend Structure`
Recommended backend structure:
```text
backend/
├── manage.py
├── requirements.txt
├── config/
└── apps/
```

### 7. Backend Folder Responsibilities
`backend/manage.py`
This is the Django command file.

We use it to run commands like:
```text
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
```

In simple words:
```text
manage.py = Django command controller
```

### `backend/requirements.txt`
This file lists all Python packages needed by the backend.

Example packages:
```text
Django
djangorestframework
django-cors-headers
djangorestframework-simplejwt
```

Team members can install the same backend dependencies with:
```text
pip install -r requirements.txt
```

### `backend/config/`
This folder contains global Django configuration.

Important files:
```text
settings.py
urls.py
wsgi.py
```

`settings.py` contains project settings, such as installed apps and database settings.

`urls.py` contains the main backend URL routes.

`wsgi.py` is used for deployment later. We usually do not touch it at the beginning.

### `backend/apps/`
This folder contains our own backend feature modules.

Recommended structure:
```text
apps/
├── users/
├── projects/
├── data_sources/
├── risk_assessments/
├── imports/
└── reports/
```

Each folder is a Django app.

In simple words:
```text
apps = backend features
```

## 8. Backend App Responsibilities
### `apps/users/`
Responsible for:

- login
- registration
- user roles
- permissions

Related user story:
```text
US-05 Login
US-13 User Roles
```

### `apps/projects/`
Responsible for privacy projects.

A project represents one ML pipeline or dataset collection.

Related user stories:
```text
US-01 Create Project
US-04 Project Overview
US-06 Project Detail
```

Example project data:
```text
name
description
data_sources_count
created_at
updated_at
```

### `apps/data_sources/`
Responsible for datasets or data sources inside a project.

Related user stories:
```text
US-02 Add Data Sources
US-07 Different Data Source Types
US-12 Dataset Preview
```

Example data source data:
```text
project
name
source_type
description
contains_personal_data
contains_art9_data
risk_level
preview_text
metadata
```

### `apps/risk_assessments/`
Responsible for privacy risk logic.

Related user stories:
```text
US-03 Personal Data and Art. 9 Check
US-11 Risk Recommendations
```

Simple first risk rule:
```text
No personal data -> green
Personal data but no Art. 9 data -> yellow
Art. 9 data -> red
```

### `apps/imports/`
Responsible for importing JSON files.

Related user story:
```text
US-09 JSON Import
```
### `apps/reports/`
Responsible for generating reports.

Related user story:
```text
US-08 PDF Report Export
```

## 9. Important Backend Concepts
### Model
A model defines what data looks like in the database.

Example:
```
class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
```
```text
model = database structure
```


### Serializer


A serializer converts Django data into JSON for the frontend.

It also validates data sent from the frontend.

```text
serializer = translator between Django and JSON
```

### View or ViewSet
A view receives requests from the frontend and returns responses.

Example:
```text
Frontend asks: give me all projects
Backend view: gets projects from database and returns JSON
```

```
view = API request handler
```

### URL
A URL connects an API path to a backend view.

```
url = backend route map
```

## 10. How a User Story Is Developed
Every user story will be suggested to follow this general flow:
```text
Backend model
    ↓
Backend serializer
    ↓
Backend API view
    ↓
Backend URL
    ↓
Frontend API function
    ↓
Frontend page or component
    ↓
Manual test
```

Example for US-01:
```text
Create Project
    ↓
Project model
    ↓
Project serializer
    ↓
Project API endpoint
    ↓
createProject() frontend API function
    ↓
Projects page create dialog
    ↓
User can create a project in the browser
```

<!-- ## 11. Main Rule for Team Development

Use this rule:
```text
If it is visible in the browser -> frontend
If it stores data or handles rules -> backend
If it explains the project -> docs
```

For frontend:
```text
Reusable UI -> components
Feature-specific page -> features
Backend request -> api
Global setup -> app
```

For backend:
```text
User/login logic -> users
Project logic -> projects
Dataset logic -> data_sources
Risk logic -> risk_assessments
Import logic -> imports
Report logic -> reports
``` -->
