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
    """
    Registro de un usuario.
    Espera un JSON con al menos:
        {
          "email": "ejemplo@correo.com",
          "password": "123456",
          "nombre_completo": "Tu Nombre",
          "rating_inicial": 4.5
          ...
        }
    Retorna:
        {
          "refresh": "...",
          "access": "...",
          "user": { "id": ..., "nombre_completo": ..., ... }
        }
    """
    data = request.data

    email = data.get('email')
    password = data.get('password')
    nombre = data.get('nombre_completo', 'Sin nombre')
    rating = data.get('rating_inicial')  # opcional
    club = data.get('club')             # opcional

    # Validaciones mínimas
    if not email or not password:
        return Response({"detail": "Email y password son obligatorios."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Verificar si ya existe
    if Usuario.objects.filter(email=email).exists():
        return Response({"detail": "Este correo ya está registrado."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Crear el usuario (usando Django's make_password si tu modelo no extiende AbstractBaseUser)
    new_user = Usuario(
        email=email,
        nombre_completo=nombre,
        rating_inicial=rating,
        club=club
    )
    # Cifrar la contraseña
    new_user.password = make_password(password)
    new_user.save()

    # OPCIONAL: Generar tokens JWT
    refresh = RefreshToken.for_user(new_user)
    access_token = refresh.access_token

    # Retornar tokens + datos de usuario
    return Response({
        "refresh": str(refresh),
        "access": str(access_token),
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "nombre_completo": new_user.nombre_completo,
            "rating_inicial": str(new_user.rating_inicial) if new_user.rating_inicial else None,
            "club": new_user.club,
        }
    }, status=status.HTTP_201_CREATED)

def login_view(request):
    """
    Inicio de sesión. 
    Espera un JSON: { "email": "...", "password": "..." }
    Retorna tokens JWT si las credenciales son válidas.
    """
    data = request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response({"detail": "Email y password son obligatorios."},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        usuario = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response({"detail": "Usuario no encontrado."},
                        status=status.HTTP_404_NOT_FOUND)

    # Verificar la contraseña.
    # Si tu modelo no extiende AbstractBaseUser, no tienes user.check_password().
    # Alternativa: from django.contrib.auth.hashers import check_password
    from django.contrib.auth.hashers import check_password
    if not check_password(password, usuario.password):
        return Response({"detail": "Credenciales inválidas."},
                        status=status.HTTP_401_UNAUTHORIZED)

    # Generar tokens
    refresh = RefreshToken.for_user(usuario)
    access_token = refresh.access_token

    return Response({
        "refresh": str(refresh),
        "access": str(access_token),
        "user": {
            "id": usuario.id,
            "email": usuario.email,
            "nombre_completo": usuario.nombre_completo,
        }
    }, status=status.HTTP_200_OK)
