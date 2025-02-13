from django.db import models

# Create your models here.

class Tag(models.Model):
    nombre = models.CharField(max_length=50, unique=True,blank=True, null=True)

    def __str__(self):
        return self.nombre
    
class Torneo(models.Model):
    nombre = models.CharField(max_length=255)
    sede = models.CharField(max_length=255)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    premio_dinero = models.DecimalField(max_digits=10, decimal_places=2, default=0.00,verbose_name="Premio ($)")  # Valor predeterminado: 0.00
    puntos = models.IntegerField(default=0, verbose_name="Puntos para Ranking")  # Obligatorio con valor por defecto
    imagen_url = models.URLField(max_length=500, verbose_name="Imagen URL")
    tags = models.ManyToManyField(
        Tag, 
        blank=True, 
        verbose_name="Categorías del Torneo"
        )  # Relación muchos a muchos
    createdT = models.DateTimeField(auto_now_add=True,verbose_name="Creado") #Para saber cuanto tiempo lleva Creado
    modifiedT = models.DateTimeField(auto_now=True, verbose_name="Modificado") #Para saber última modificación

    def __str__(self):
        return f"{self.nombre} - {self.sede} ({self.fecha_inicio} - {self.fecha_fin})"
    