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
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.users.views import (
    current_user,
    password_reset_confirm,
    password_reset_request,
    register_user,
)

from apps.projects.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.projects.urls")),
    path("api/", include("apps.data_sources.urls")),
    path("api/", include("apps.risk_assessments.urls")),
    path("api/health/", health_check, name="health-check"),

    path("api/auth/register/", register_user, name="register_user"),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", current_user, name="current_user"),
    path("api/auth/password-reset/", password_reset_request, name="password_reset_request"),
    path("api/auth/password-reset-confirm/",password_reset_confirm, name="password_reset_confirm"),
]
