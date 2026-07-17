from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("project_created", "Project created"),
                    ("project_updated", "Project updated"),
                    ("project_deleted", "Project deleted"),
                    ("data_source_created", "Data source created"),
                    ("data_source_updated", "Data source updated"),
                    ("data_source_deleted", "Data source deleted"),
                    ("high_risk_detected", "High risk detected"),
                ],
                max_length=40,
            ),
        ),
    ]
