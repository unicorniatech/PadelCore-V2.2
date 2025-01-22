from rest_framework import serializers
from .models import Torneo
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

class TorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Torneo
        fields = '__all__'
    def validate_tags(self, value): #Esto es para cuando meta los tags
        if len(value) > 3:
            raise serializers.ValidationError("No puedes seleccionar más de 3 tags.")
        tags_nombres = [tag.nombre for tag in value]
        if "Amateur" in tags_nombres and "Profesional" in tags_nombres:
            raise serializers.ValidationError('No puedes seleccionar "Amateur" y "Profesional" al mismo tiempo.')
    def validate_imagen_url(self, value): #Esto es para para validar que sea un URL válido
        validator = URLValidator()
        try:
            validator(value)
        except ValidationError:
            raise serializers.ValidationError("La URL proporcionada no es válida.")

        return value
