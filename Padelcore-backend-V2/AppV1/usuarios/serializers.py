from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'  # Incluye todos los campos del modelo
        # Alternativamente, puedes especificar campos específicos:
        # fields = ['id', 'nombre', 'correo', 'edad']

    # Ejemplo de validación personalizada:
    #def validate_edad(self, value):
    #    if value < 18:
    #        raise serializers.ValidationError("El usuario debe ser mayor de edad.")
    #    return value
