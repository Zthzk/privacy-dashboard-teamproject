# Generated manually on 2026-04-30

from django.db import migrations, models


OLD_FORMAT_VALUES = {"text", "image", "csv", "json", "other"}


def migrate_source_type_to_format(apps, schema_editor):
    DataSource = apps.get_model("datasources", "DataSource")

    for data_source in DataSource.objects.all():
        if data_source.source_type in OLD_FORMAT_VALUES:
            data_source.data_format = data_source.source_type
            data_source.source_type = (
                "other" if data_source.source_type == "other" else "file"
            )
            data_source.save(update_fields=["data_format", "source_type"])


def restore_format_to_source_type(apps, schema_editor):
    DataSource = apps.get_model("datasources", "DataSource")

    for data_source in DataSource.objects.all():
        data_source.source_type = data_source.data_format
        data_source.save(update_fields=["source_type"])


class Migration(migrations.Migration):

    dependencies = [
        ("datasources", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="datasource",
            name="contains_personal_data",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="datasource",
            name="data_format",
            field=models.CharField(
                choices=[
                    ("text", "Text"),
                    ("image", "Image"),
                    ("csv", "CSV"),
                    ("json", "JSON"),
                    ("other", "Other"),
                ],
                default="text",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="datasource",
            name="last_scanned_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="datasource",
            name="metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="datasource",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.RunPython(
            migrate_source_type_to_format,
            reverse_code=restore_format_to_source_type,
        ),
        migrations.AlterField(
            model_name="datasource",
            name="source_type",
            field=models.CharField(
                choices=[
                    ("file", "File"),
                    ("database", "Database"),
                    ("api", "API"),
                    ("url", "URL"),
                    ("manual", "Manual"),
                    ("other", "Other"),
                ],
                default="file",
                max_length=20,
            ),
        ),
        migrations.AlterModelOptions(
            name="datasource",
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="datasource",
            constraint=models.UniqueConstraint(
                fields=("project", "name"),
                name="uniq_ds_name_per_project",
            ),
        ),
        migrations.AddIndex(
            model_name="datasource",
            index=models.Index(
                fields=["project", "source_type"],
                name="ds_project_type_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="datasource",
            index=models.Index(
                fields=["project", "data_format"],
                name="ds_project_format_idx",
            ),
        ),
    ]
