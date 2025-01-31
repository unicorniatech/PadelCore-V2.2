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
    rol = data.get('rol', 'usuario')  # si no mandas nada, default a 'player'

    # Validar campos mínimos
    if not email or not password:
        return Response(
            {"detail": "Email y contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Verificar si ya existe
    if Usuario.objects.filter(email=email).exists():
        return Response(
            {"detail": "Este correo ya está registrado."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Crear el usuario
    new_user = Usuario.objects.create_user(
        email=email,
        password=password,
        nombre_completo=nombre_completo,
        rol=rol
    )

    # Generar tokens
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
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    """
    Iniciar sesión de un usuario existente.
    Espera datos en JSON:
    {
      "email": "...",
      "password": "..."
    }
    Retorna tokens y datos del usuario.
    """
    data = request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response(
            {"detail": "Email y contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response(
            {"detail": "Usuario no encontrado."},
            status=status.HTTP_404_NOT_FOUND
        )

    if not user.check_password(password):
        return Response(
            {"detail": "Credenciales inválidas."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # (Opcional) Verificar si el usuario está activo
    if not user.is_active:
        return Response(
            {"detail": "Este usuario se encuentra inactivo."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Generar tokens
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
    }, status=status.HTTP_200_OK)