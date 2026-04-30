from django.db import models


class DataSource(models.Model):
    class SourceType(models.TextChoices):
        FILE = "file", "File"
        DATABASE = "database", "Database"
        API = "api", "API"
        URL = "url", "URL"
        MANUAL = "manual", "Manual"
        OTHER = "other", "Other"

    class DataFormat(models.TextChoices):
        TEXT = "text", "Text"
        IMAGE = "image", "Image"
        CSV = "csv", "CSV"
        JSON = "json", "JSON"
        OTHER = "other", "Other"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="data_sources",
    )

    name = models.CharField(max_length=100)
    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.FILE,
    )
    data_format = models.CharField(
        max_length=20,
        choices=DataFormat.choices,
        default=DataFormat.TEXT,
    )
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    contains_personal_data = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                name="uniq_ds_name_per_project",
            ),
        ]
        indexes = [
            models.Index(
                fields=["project", "source_type"],
                name="ds_project_type_idx",
            ),
            models.Index(
                fields=["project", "data_format"],
                name="ds_project_format_idx",
            ),
        ]

    def __str__(self):
        return f"{self.project.name} / {self.name}"
