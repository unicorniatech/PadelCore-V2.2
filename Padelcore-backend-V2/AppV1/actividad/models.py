from django.db import models
from django.utils import timezone

class ActividadReciente(models.Model):
    TIPO_CHOICES = (
        ('usuario', 'Usuario'),
        ('partido', 'Partido'),
        ('torneo', 'Torneo'),
    )
    ESTADO_CHOICES = (
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('', 'No aplica'),
    )

    fecha = models.DateTimeField(default=timezone.now)  # Para ordenar
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, blank=True, default='')

    # Opcional: un toString
    def __str__(self):
        return f"[{self.tipo}] {self.descripcion} ({self.estado}) - {self.fecha}"
