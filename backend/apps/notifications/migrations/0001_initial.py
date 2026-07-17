from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "notification_type",
                    models.CharField(
                        choices=[
                            ("project_created", "Project created"),
                            ("project_updated", "Project updated"),
                            ("project_deleted", "Project deleted"),
                            ("data_source_created", "Data source created"),
                            ("data_source_updated", "Data source updated"),
                            ("data_source_deleted", "Data source deleted"),
                        ],
                        max_length=40,
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("message", models.TextField()),
                ("link", models.CharField(blank=True, max_length=255)),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["is_read", "-created_at"], name="notif_read_created_idx"),
        ),
    ]

