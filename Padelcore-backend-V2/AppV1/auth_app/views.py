# auth_app/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
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

    # Manejo de email o password faltantes
    if not email or not password:
        return Response({"detail": "Faltan campos (email/password)."}, status=400)

    try:
        new_user = Usuario.objects.create_user(
            email=email,
            password=password,
            nombre_completo=nombre_completo,
            rol=rol
        )
    except IntegrityError:
        return Response({"detail": "El email ya está en uso."}, status=400)

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
    data = request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response({"detail": "Faltan campos (email/password)."}, status=400)

    try:
        user = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response({"detail": "Usuario no encontrado."}, status=404)

    if not user.check_password(password):
        return Response({"detail": "Credenciales inválidas."}, status=401)

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