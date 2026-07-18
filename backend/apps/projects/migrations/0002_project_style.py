from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="icon_key",
            field=models.CharField(
                choices=[
                    ("message", "Support"),
                    ("shopping", "Commerce"),
                    ("traffic", "Traffic"),
                    ("health", "Health"),
                ],
                default="message",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="color",
            field=models.CharField(
                choices=[
                    ("primary", "Blue"),
                    ("success", "Green"),
                    ("warning", "Amber"),
                    ("error", "Red"),
                ],
                default="primary",
                max_length=20,
            ),
        ),
    ]
