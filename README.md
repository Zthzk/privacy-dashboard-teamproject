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
source .venv/bin/activate
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
