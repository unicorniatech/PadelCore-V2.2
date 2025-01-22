from rest_framework import serializers
from .models import ActividadReciente

class ActividadRecienteSerializer(serializers.ModelSerializer):
    """
    Serializador para convertir los objetos ActividadReciente
    a formatos JSON/REST y viceversa.
    """
    class Meta:
        model = ActividadReciente
        fields = '__all__'
        # O si prefieres, fields = ['id', 'fecha', 'tipo', 'descripcion', 'estado']
