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
        AUDIO = "audio", "Audio"
        VIDEO = "video", "Video"
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
    # Separate from metadata so violations can be queried and consumed independently
    # by a future risk escalation step without parsing the unstructured metadata blob.
    compliance_violations = models.JSONField(default=list, blank=True)
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


class DataSourceVersion(models.Model):
    """
    Stores an append-only snapshot of a DataSource and its risk assessment.

    Each version preserves the data source fields and calculated privacy status
    at a specific point in time, allowing changes to be tracked historically.
    """
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField()
    name = models.CharField(max_length=100)
    source_type = models.CharField(max_length=20, choices=DataSource.SourceType.choices)
    data_format = models.CharField(max_length=20, choices=DataSource.DataFormat.choices)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    contains_personal_data = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    compliance_violations = models.JSONField(default=list, blank=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)
    risk_level = models.CharField(max_length=20, blank=True)
    art_9_data = models.CharField(max_length=20, blank=True)
    contains_art9_data = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["data_source", "version_number"],
                name="uniq_ds_version_number",
            ),
        ]
        indexes = [
            models.Index(
                fields=["data_source", "-version_number"],
                name="ds_version_latest_idx",
            ),
        ]

    def __str__(self):
        return f"{self.data_source} v{self.version_number}"
