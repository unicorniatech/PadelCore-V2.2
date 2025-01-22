from django.db import models

# Create your models here.
class Usuario(models.Model):
    nombre_completo = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    rating_inicial = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)  # Puedes ajustar según el formato del rating
    club = models.CharField(max_length=255, blank=True, null=True)  # Opcional: permite valores en blanco o nulos
    createdU = models.DateTimeField(auto_now_add=True,verbose_name="Creado") #Para saber cuanto tiempo lleva Creado
    modifiedU = models.DateTimeField(auto_now=True, verbose_name="Modificado") #Para saber última modificación

    def __str__(self):
        return self.nombre_completo 
    