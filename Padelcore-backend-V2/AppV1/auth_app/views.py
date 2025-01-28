# auth_app/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from usuarios.models import Usuario
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
def register_view(request):

    data = request.data

    email = data.get('email')
    password = data.get('password')
    # Lo que envíes desde el front:
    nombre_completo = data.get('nombre_completo', 'Sin Nombre')
    rol = data.get('rol', 'player')  # si no mandas nada, default a 'player'

    # Crea al usuario
    new_user = Usuario.objects.create_user(
        email=email,
        password=password,
        nombre_completo=nombre_completo,
        rol=rol
    )

    # Generar tokens (si usas DRF Simple JWT)
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(new_user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "rol": new_user.rol,
            "nombre_completo": new_user.nombre_completo,
        }
    }, status=201)

def login_view(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')

    try:
        user = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response({"detail": "Usuario no encontrado."}, status=404)

    if not user.check_password(password):
        return Response({"detail": "Credenciales inválidas."}, status=401)

    # Generar tokens
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)

    return Response({
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": {
            "id": user.id,
            "email": user.email,
            "rol": user.rol,
            "nombre_completo": user.nombre_completo,
        }
    }, status=200)
