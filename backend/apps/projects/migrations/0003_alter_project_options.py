from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0002_project_style"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="project",
            options={"ordering": ["-updated_at", "-created_at", "-id"]},
        ),
    ]
