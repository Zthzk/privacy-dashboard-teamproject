from django.urls import path

from . import views


urlpatterns = [
    path("datasources/", views.data_sources, name="data-sources"),
    path(
        "datasource-format-hints/",
        views.data_format_hints,
        name="data-format-hints",
    ),
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
    path(
        "projects/<int:project_id>/datasources/<int:data_source_id>/versions/",
        views.project_data_source_versions,
        name="project-data-source-versions",
    ),
    path(
        "projects/<int:project_id>/datasources/<int:data_source_id>/versions/<int:version_number>/",
        views.project_data_source_version_detail,
        name="project-data-source-version-detail",
    ),
]
