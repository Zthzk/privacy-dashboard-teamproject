"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.projects.views import health_check, project_list

from apps.projects.views import health_check
from apps.users.views import current_user

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),

    # Public endpoint
    # Used to check whether the backend is running.
    path("api/health/", health_check, name="health_check"),

    # Authentication API
    # The React frontend sends username and password here and receives access/refresh tokens.
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),

    # Authentication API
    # The React frontend uses this endpoint to refresh an expired access token.
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Authentication API
    # Returns the currently logged-in user when a valid JWT access token is provided.
    path("api/auth/me/", current_user, name="current_user"),

    # Protected project endpoint
    # This represents project data that should only be visible after login.
    path("api/projects/", project_list, name="project_list"),
]



