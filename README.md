# Privacy Dashboard

A web dashboard for monitoring and documenting privacy risks in machine learning pipeline datasets.

The application helps ML engineers, data protection officers, and project teams understand whether datasets contain personal data, whether special categories under Art. 9 GDPR may be involved, and where privacy-related action is needed.

<!-- ## Tech Stack

- Frontend: React + Vite
- Backend: Django + Django REST Framework
- Database: SQLite for development
- API Format: JSON over HTTP
- Authentication: planned with JWT -->

## Project Structure

```text
privacy-dashboard-teamproject/
├── frontend/   # React user interface
├── backend/    # Django REST API
├── docs/       # project documentation
└── README.md
```

## How to Run the Project
### Backend
In terminal:
```text
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend runs at:\
http://127.0.0.1:8000

Health check endpoint:\
http://127.0.0.1:8000/api/health

### Frontend
Open a second terminal:

```text
cd frontend
npm run dev
```

Frontend runs at:\
http://localhost:5173

Both frontend and backend must run at the same time during development.

## Development Principle
Every user story should be implemented through a clear frontend/backend flow:
```text
React page or component
↓
frontend API function
↓
Django REST endpoint
↓
serializer
↓
model/database
```

## Documentation
Important project documents are stored in `docs/`: 

- `architecture.md`: technical architecture and folder responsibilities
- `development-workflow.md`: how to implement a user story
- `api.md`: API endpoint conventions
- `user-stories.md`: project user stories and implementation mapping
- `definition-of-done.md`: completion criteria
- `testing.md`: how tests are run and what they cover


## Screenshots

The screenshots below provide a visual overview of the main application workflows.

### Dashboard Overview

The dashboard summarizes the available projects, data sources, and identified privacy-risk levels.

![Privacy Dashboard overview](docs/images/Dashboard-Overview.png)
![Projects Overview](docs/images/Projects-overview.png)
![Data Sources Overview](docs/images/Data-Sources-Overview.png)


### Project Details

The project detail page groups the relevant data sources and privacy information for one ML project or pipeline.

![Project detail view](docs/images/Project-Details.png)

### Data Source Assessment

The data-source form allows users to document whether personal data or special categories of personal data are involved.

![Dataset preview](docs/images/Dataset-Preview.png)
![Data source assessment form](docs/images/Risk-Assessment.png)

### Privacy Risk Result

The risk result presents the calculated risk level and relevant recommendations in an understandable format.

![Privacy risk result](docs/images/ProjectsDetails-2.png)
![Risk Recommendation](docs/images/Risk-Recommendations.png)


