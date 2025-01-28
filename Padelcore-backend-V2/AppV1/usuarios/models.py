from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from django.db import models
from .managers import UsuarioManager

# Create your models here
class Usuario(AbstractBaseUser, PermissionsMixin):
    # Definimos los roles posibles
    ROL_CHOICES = (
        ('admin', 'Admin'),
        ('sponsor', 'Sponsor'),
        ('player', 'Player'),
        ('usuario', 'Usuario'),  # rol genérico
    )
    nombre_completo = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    rating_inicial = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)  # Puedes ajustar según el formato del rating
    club = models.CharField(max_length=255, blank=True, null=True)  # Opcional: permite valores en blanco o nulos
    createdU = models.DateTimeField(auto_now_add=True,verbose_name="Creado") #Para saber cuanto tiempo lleva Creado
    modifiedU = models.DateTimeField(auto_now=True, verbose_name="Modificado") #Para saber última modificación
    # Nuevo campo 'rol' 
    rol = rol = models.CharField(
        max_length=50,
        choices=ROL_CHOICES,
        default='usuario'  # O 'player', según quieras
    )  
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre_completo']

    objects = UsuarioManager()  # tu manager

    def __str__(self):
        return self.email