from rest_framework import viewsets
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuarioSerializer
from actividad.models import ActividadReciente
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def create(self, request, *args, **kwargs):
        # 1) Llamamos al create original de DRF, que crea el usuario y retorna su data
        response = super().create(request, *args, **kwargs)
        
        # 2) Con el 'id' recién creado, obtenemos la instancia del usuario
        new_user_id = response.data["id"]  # asumiendo que 'id' viene en la respuesta
        usuario = Usuario.objects.get(id=new_user_id)
        
        # 3) Creamos la actividad: tipo='usuario', estado=''
        actividad = ActividadReciente.objects.create(
            fecha=timezone.now(),
            tipo='usuario',
            descripcion=f"Se ha registrado un jugador: {usuario.nombre_completo}",
            estado='directo',  
        )
        
        # 4) Emitimos un evento por WebSocket
        channel_layer = get_channel_layer()
        data = {
            "id": actividad.id,       # para identificar la actividad
            "fecha": str(actividad.fecha),
            "tipo": actividad.tipo, 
            "descripcion": actividad.descripcion,
            "estado": actividad.estado,
        }
        async_to_sync(channel_layer.group_send)(
            "actividad",  # coincide con ActividadConsumer
            {
                "type": "actividad_message",
                "data": data
            }
        )

        # 5) Retornamos la misma respuesta
        return response

















