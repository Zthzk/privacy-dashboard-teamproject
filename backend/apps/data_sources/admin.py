from django.contrib import admin

from .models import DataSource


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "project",
        "source_type",
        "data_format",
        "contains_personal_data",
        "created_at",
    )
    list_filter = (
        "source_type",
        "data_format",
        "contains_personal_data",
        "project",
    )
    search_fields = ("name", "description", "location", "project__name")
