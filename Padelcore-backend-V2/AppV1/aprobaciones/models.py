from django.db import models
from django.utils import timezone

class Aprobacion(models.Model):
    TIPO_CHOICES = (
        ('tournament', 'Tournament'),
        ('match', 'Match'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    data = models.JSONField()  # Aquí guardas la info necesaria para crear Torneo o Partido
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.tipo} - {self.status} - creado {self.created_at}"
