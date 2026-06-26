"""Database models for project data sources and their immutable versions."""

from django.db import models


class DataSource(models.Model):
    """Represent the current editable state of a data source in a project."""

    class SourceType(models.TextChoices):
        """Supported origins from which a data source can be obtained."""

        FILE = "file", "File"
        DATABASE = "database", "Database"
        API = "api", "API"
        URL = "url", "URL"
        MANUAL = "manual", "Manual"
        OTHER = "other", "Other"

    class DataFormat(models.TextChoices):
        """Supported formats for the content of a data source."""

        TEXT = "text", "Text"
        IMAGE = "image", "Image"
        AUDIO = "audio", "Audio"
        VIDEO = "video", "Video"
        CSV = "csv", "CSV"
        JSON = "json", "JSON"
        OTHER = "other", "Other"

    # Deleting a project also removes all of its associated data sources.
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="data_sources",
    )

    # Descriptive fields entered by the user.
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

    # Privacy assessment results and supporting metadata for the current state.
    contains_personal_data = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    # Kept separate from metadata so violations can be queried and processed
    # without parsing an otherwise general-purpose metadata object.
    compliance_violations = models.JSONField(default=list, blank=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    # Django manages these timestamps automatically.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Show the most recently created data sources first by default.
        ordering = ["-created_at"]
        constraints = [
            # A project cannot contain two data sources with the same name.
            models.UniqueConstraint(
                fields=["project", "name"],
                name="uniq_ds_name_per_project",
            ),
        ]
        indexes = [
            # These indexes support common project-level filtering operations.
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
        """Return a readable project and data-source identifier."""
        return f"{self.project.name} / {self.name}"


class DataSourceVersion(models.Model):
    """
    Store an append-only snapshot of a data source and its risk assessment.

    Each version preserves the data-source fields and calculated privacy status
    at a specific point in time so that historical changes remain traceable.
    """

    # Versions are removed automatically when their parent data source is deleted.
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField()

    # These fields intentionally duplicate DataSource values to preserve the
    # exact state that existed when this immutable snapshot was created.
    name = models.CharField(max_length=100)
    source_type = models.CharField(max_length=20, choices=DataSource.SourceType.choices)
    data_format = models.CharField(max_length=20, choices=DataSource.DataFormat.choices)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    contains_personal_data = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    compliance_violations = models.JSONField(default=list, blank=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)

    # Store derived risk values directly so old assessments do not change when
    # the current scoring implementation is updated.
    risk_level = models.CharField(max_length=20, blank=True)
    art_9_data = models.CharField(max_length=20, blank=True)
    contains_art9_data = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Return the newest version first when accessing a version collection.
        ordering = ["-version_number"]
        constraints = [
            # Version numbers are unique only within their parent data source.
            models.UniqueConstraint(
                fields=["data_source", "version_number"],
                name="uniq_ds_version_number",
            ),
        ]
        indexes = [
            # Optimizes retrieval of the latest version for a data source.
            models.Index(
                fields=["data_source", "-version_number"],
                name="ds_version_latest_idx",
            ),
        ]

    def __str__(self):
        """Return the data-source identifier followed by its version number."""
        return f"{self.data_source} v{self.version_number}"
