# pendientes/serializers.py
from rest_framework import serializers
from .models import Aprobacion

class AprobacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aprobacion
        fields = '__all__'
