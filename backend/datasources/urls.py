from django.urls import path

from . import views


urlpatterns = [
    path(
        "projects/<int:project_id>/datasources/",
        views.project_data_sources,
        name="project-data-sources",
    ),
]
