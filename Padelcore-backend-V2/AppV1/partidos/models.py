from django.db import models
from torneos.models import Torneo
from usuarios.models import Usuario
from django.core.exceptions import ValidationError

# Create your models here.
class Partido(models.Model):
    torneo = models.ForeignKey(
        Torneo,
        on_delete=models.CASCADE, #Elimina los partidos si se llega a eliminar el torneo
        related_name="partidos",
        verbose_name="Torneo"
    )
    equipo_1 = models.ManyToManyField(
        Usuario,
        related_name="equipo_1",
        verbose_name= "Equipo 1",
        
    )  
    equipo_2 = models.ManyToManyField(
        Usuario,
        related_name="equipo_2",
        verbose_name="Equipo 2",
        
    )  
    fecha = models.DateField()
    hora = models.TimeField()
    resultado = models.CharField(max_length=255, blank=True, null=True)  # Opcional, se completa después del partido
    createdP = models.DateTimeField(auto_now_add=True,verbose_name="Creado") #Para saber cuanto tiempo lleva Creado
    modifiedP = models.DateTimeField(auto_now=True, verbose_name="Modificado") #Para saber última modificación

    def __str__(self):
        return f"{self.equipo_1} vs {self.equipo_2} - {self.fecha} {self.hora}"
    
    def clean(self):
        super().clean()
        if self.equipo_1.count() != 2:
            raise ValidationError("El equipo 1 debe tener exactamente 2 jugadores.")
        if self.equipo_2.count() != 2:
            raise ValidationError("El equipo 2 debe tener exactamente 2 jugadores.")