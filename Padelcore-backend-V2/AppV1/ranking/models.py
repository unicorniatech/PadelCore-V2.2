# ranking/models.py
from django.db import models
from django.conf import settings
import uuid

class RankingRecord(models.Model):
    """
    Guarda la información de un usuario en un ranking
    para un periodo dado (mes, año, etc.).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ranking_records'
    )

    # Fecha/mes de la clasificación
    # Ej: "2025-04-01" para 'ranking de abril 2025'
    date = models.DateField()


    # rating en ese momento
    rating_snapshot = models.DecimalField(max_digits=6, decimal_places=2)

    # posición en el ranking => 1 es el #1, 2 es #2, etc.
    position = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ordenar desc por rating, o por position asc, lo que quieras
        ordering = ['position']

    def __str__(self):
        return f"{self.user.email} - {self.date} - #{self.position}"
