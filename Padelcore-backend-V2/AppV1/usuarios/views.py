from rest_framework import viewsets
from .models import Usuario
from actividad.models import ActividadReciente
from .serializers import UsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def create_usuario(request):
        # ... lógicas
        usuario = Usuario.objects.create(...)
        # Crear actividad
        ActividadReciente.objects.create(
            tipo='usuario',
            descripcion=f"Registro Usuario: {usuario.nombre_completo}",
            estado='',  # Sin aprobación
        )

















#from django.shortcuts import render

# Create your views here.
#from rest_framework.views import APIView  # Clase base para vistas basadas en API
#from rest_framework.response import Response  # Para devolver respuestas JSON
#from rest_framework import status  # Para definir códigos de estado HTTP
#from .models import Usuario  # Importamos el modelo de usuario
#from django.contrib.auth.hashers import make_password  # Para encriptar la contraseña

# Vista para manejar el registro de usuarios
#class RegistrarUsuario(APIView):
#    """
#    Recibe una solicitud POST con los datos de un nuevo usuario
#    y lo guarda en la base de datos si los datos son válidos.
#    """
#    def post(self, request):
#        # Extraemos los datos enviados en la solicitud
#        data = request.data
#
#        try:
#            # Creamos un nuevo usuario en la base de datos
#            usuario = Usuario.objects.create(
#                nombre_completo=data['nombre_completo'],  # Guardamos el nombre completo
#                correo_electronico=data['correo_electronico'],  # Guardamos el correo
#                contraseña=make_password(data['contraseña'])  # Encriptamos y guardamos la contraseña
#            )
#            
#            # Devolvemos un mensaje de éxito
#            return Response({'mensaje': 'Usuario registrado exitosamente'}, status=status.HTTP_201_CREATED)
#        except Exception as e:
#            # Devolvemos un mensaje de error si algo falla
#            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
