from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("data_sources", "0004_datasourceversion"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="datasource",
            options={"ordering": ["-updated_at", "-created_at", "-id"]},
        ),
    ]
