# Generated manually on 2026-04-30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="status",
            field=models.CharField(
                choices=[("active", "Active"), ("archived", "Archived")],
                default="active",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterModelOptions(
            name="project",
            options={"ordering": ["-created_at"]},
        ),
    ]
