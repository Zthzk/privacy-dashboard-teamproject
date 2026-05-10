from django.urls import path

from . import views


urlpatterns = [
    path(
        "projects/<int:project_id>/datasources/",
        views.project_data_sources,
        name="project-data-sources",
    ),
    path(
        "projects/<int:project_id>/datasources/<int:data_source_id>/",
        views.project_data_source_detail,
        name="project-data-source-detail",
    ),
]
