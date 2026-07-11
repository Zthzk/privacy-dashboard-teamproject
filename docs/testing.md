 # Testing Guide

This document explains how to run the automated tests and how to manually verify the main functionality of the Privacy Dashboard.


## 1. Pretesting

Before running the tests, make sure that the project dependencies are installed.

### Backend setup

From the project root:

```bash
cd backend
```

Create and activate a Python virtual environment if one does not already exist:

```bash
python -m venv .venv
```

On Linux or macOS:

```bash
source .venv/bin/activate
```

On Windows:

```bash
.venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Apply the database migrations:

```bash
python manage.py migrate
```

### Frontend setup

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

## 2. Running Backend Tests

The backend uses Django's built-in test framework.

To run all backend tests, execute the following command from the `backend/` directory:

```bash
python manage.py test
```

Django automatically discovers tests inside files such as:

```text
backend/apps/projects/tests.py
backend/apps/data_sources/tests.py
backend/apps/risk_assessments/tests.py
backend/apps/users/tests.py
```

To run the tests for one Django app only:

```bash
python manage.py test apps.projects
```

A successful test run ends with output similar to:

```text
Ran X tests in X.XXXs

OK
```

## 3. What Backend Tests Cover

Backend tests should verify the behaviour of the individual Django apps.

### Models

Model tests should check:

* whether objects can be created with valid data;
* whether default values are assigned correctly;
* whether required fields are enforced;
* whether relationships between projects, data sources, users, and assessments work correctly;
* whether model methods return the expected values.

### API endpoints

API tests should check:

* successful `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` requests where supported;
* correct HTTP status codes;
* validation errors for missing or invalid data;
* authentication and permission rules;
* the structure of returned JSON responses;
* access to objects that do not exist.

### Privacy-risk logic

Risk-assessment tests should cover at least the following cases:

| Personal data | Article 9 data | Expected risk |
| ------------- | -------------- | ------------- |
| No            | No             | Green         |
| Yes           | No             | Yellow        |
| Yes           | Yes            | Red           |

Additional tests should verify that recommendations and calculated values remain consistent when a data source is created or updated.

## 4. Running Frontend Tests

When frontend tests are configured, they should be run from the `frontend/` directory using the test script defined in `package.json`.

The usual command is:

```bash
npm test
```

Frontend tests should cover:

* rendering of important pages and components;
* loading, empty, success, and error states;
* form validation;
* user interactions such as buttons, dialogs, and navigation;
* API calls and the handling of API responses;
* correct display of privacy-risk levels.

## 5. Manual Testing

Automated tests do not cover every browser interaction. Important user flows must therefore also be tested manually.

### Start the application

Start the backend from the `backend/` directory:

```bash
python manage.py runserver
```

The backend is normally available at:

```text
http://127.0.0.1:8000/
```

Start the frontend in a second terminal from the `frontend/` directory:

```bash
npm run dev
```

The frontend is normally available at:

```text
http://localhost:5173/
```

Keep both processes running during manual testing.

