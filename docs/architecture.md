## Main Python Files in a Django App

Each Django app follows a common structure where every file has a specific responsibility. Separating these responsibilities keeps the backend organized, easier to maintain, and simplifies testing.

### `models.py`

`models.py` defines the database structure of the application. It contains Django **Model** classes that describe the entities stored in the database, such as projects, users, or data sources. Models also define relationships between entities and simple model-specific behavior.

> **Purpose:** Represent and manage the application's persistent data.

---

### `serializers.py`

`serializers.py` contains **Serializer** classes provided by Django REST Framework. Serializers convert Django model instances into JSON responses for the frontend and validate incoming request data before it is saved to the database.

> **Purpose:** Handle data validation and the conversion between Python objects and JSON.

---

### `views.py`

`views.py` contains the API logic in the form of **Views** or **ViewSets**. These classes receive HTTP requests, interact with models or services, and return the appropriate API responses. They act as the connection between the frontend and the backend.

> **Purpose:** Process API requests and coordinate communication between the frontend and the backend.

---

### `urls.py`

`urls.py` defines the available API endpoints and maps them to the corresponding views. Each Django app has its own URL configuration, which is included in the project's main `urls.py`.

> **Purpose:** Connect API routes to the correct request handlers.

---

### `admin.py`

`admin.py` registers models with the Django Admin interface and allows basic customization, such as displayed columns, search fields, or filters. This makes it easier to inspect and manage application data during development.

> **Purpose:** Configure the Django administration interface.

---

### `apps.py`

`apps.py` contains the **AppConfig** class, which provides configuration information for a Django app, such as its name and default settings. Django uses this configuration when loading the application.

> **Purpose:** Configure and register a Django application.

---

### `services.py`

`services.py` is used for reusable business logic that should not be placed directly in models or views. Examples include privacy-risk calculations or operations involving multiple models.

> **Purpose:** Keep business logic reusable and separate from request handling.

---

### `tests.py`

`tests.py` contains automated tests for the application's functionality. Tests verify that models, serializers, services, and API endpoints behave as expected and help prevent regressions.

> **Purpose:** Ensure the correctness and reliability of the backend.

## Backend Request Flow

A typical request passes through the backend in the following order:

```text
Frontend Request
        ↓
     urls.py
        ↓
 views.py / ViewSet
        ↓
serializers.py
        ↓
services.py (optional)
        ↓
    models.py
        ↓
    Database
```

Each file has a clearly defined responsibility, making the codebase easier to understand, extend, and maintain.

