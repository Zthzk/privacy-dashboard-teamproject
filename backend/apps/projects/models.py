from django.db import models


class Project(models.Model):
    class Icon(models.TextChoices):
        MESSAGE = "message", "Support"
        SHOPPING = "shopping", "Commerce"
        TRAFFIC = "traffic", "Traffic"
        HEALTH = "health", "Health"

    class Color(models.TextChoices):
        PRIMARY = "primary", "Blue"
        SUCCESS = "success", "Green"
        WARNING = "warning", "Amber"
        ERROR = "error", "Red"

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon_key = models.CharField(
        max_length=20,
        choices=Icon.choices,
        default=Icon.MESSAGE,
    )
    color = models.CharField(
        max_length=20,
        choices=Color.choices,
        default=Color.PRIMARY,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
