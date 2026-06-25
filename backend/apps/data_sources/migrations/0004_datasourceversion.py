# Generated for US-10 data source version snapshots.

import django.db.models.deletion
from django.db import migrations, models


def backfill_initial_versions(apps, schema_editor):
    DataSource = apps.get_model("data_sources", "DataSource")
    DataSourceVersion = apps.get_model("data_sources", "DataSourceVersion")

    versions = []
    for data_source in DataSource.objects.all().iterator():
        metadata = data_source.metadata or {}
        versions.append(
            DataSourceVersion(
                data_source=data_source,
                version_number=1,
                name=data_source.name,
                source_type=data_source.source_type,
                data_format=data_source.data_format,
                description=data_source.description,
                location=data_source.location,
                contains_personal_data=data_source.contains_personal_data,
                metadata=metadata,
                compliance_violations=data_source.compliance_violations or [],
                last_scanned_at=data_source.last_scanned_at,
                risk_level=metadata.get("risk_level", ""),
                art_9_data=metadata.get("art_9_data", ""),
                contains_art9_data=metadata.get("contains_art9_data") is True,
            )
        )

    DataSourceVersion.objects.bulk_create(versions)


class Migration(migrations.Migration):

    dependencies = [
        ("data_sources", "0003_datasource_compliance_violations"),
    ]

    operations = [
        migrations.CreateModel(
            name="DataSourceVersion",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("version_number", models.PositiveIntegerField()),
                ("name", models.CharField(max_length=100)),
                (
                    "source_type",
                    models.CharField(
                        choices=[
                            ("file", "File"),
                            ("database", "Database"),
                            ("api", "API"),
                            ("url", "URL"),
                            ("manual", "Manual"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "data_format",
                    models.CharField(
                        choices=[
                            ("text", "Text"),
                            ("image", "Image"),
                            ("audio", "Audio"),
                            ("video", "Video"),
                            ("csv", "CSV"),
                            ("json", "JSON"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                ("description", models.TextField(blank=True)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("contains_personal_data", models.BooleanField(default=False)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("compliance_violations", models.JSONField(blank=True, default=list)),
                ("last_scanned_at", models.DateTimeField(blank=True, null=True)),
                ("risk_level", models.CharField(blank=True, max_length=20)),
                ("art_9_data", models.CharField(blank=True, max_length=20)),
                ("contains_art9_data", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "data_source",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="data_sources.datasource",
                    ),
                ),
            ],
            options={
                "ordering": ["-version_number"],
            },
        ),
        migrations.AddConstraint(
            model_name="datasourceversion",
            constraint=models.UniqueConstraint(
                fields=("data_source", "version_number"),
                name="uniq_ds_version_number",
            ),
        ),
        migrations.AddIndex(
            model_name="datasourceversion",
            index=models.Index(
                fields=["data_source", "-version_number"],
                name="ds_version_latest_idx",
            ),
        ),
        migrations.RunPython(backfill_initial_versions, migrations.RunPython.noop),
    ]
