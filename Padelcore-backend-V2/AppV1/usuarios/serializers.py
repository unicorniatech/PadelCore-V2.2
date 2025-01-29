from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    rol = serializers.ChoiceField(choices=Usuario.ROL_CHOICES, required=False)
    class Meta:
        model = Usuario
        fields = [
            'id',
            'email',
            'nombre_completo',
            'rating_inicial',
            'club',
            'rol',
            'password',
            'is_active',
            'is_staff',
            'date_joined',
            'createdU',
            'modifiedU',
        ]
         # Campos de solo lectura (no queremos que los cambie el front)
        read_only_fields = ['id', 'createdU', 'modifiedU', 'is_staff', 'date_joined', 'is_active']

    def create(self, validated_data):
        """
        Se llama al crear un usuario (POST).
        - Extraemos 'password' si viene en el request.
        - Ajustamos 'rol' si es admin => is_staff = True (opcional).
        - Se llama 'set_password()' para hashear la contraseña.
        """
        password = validated_data.pop('password', None)
        rol = validated_data.get('rol', 'usuario')  # por defecto 'usuario'

        user = super().create(validated_data)

        # Manejo de contraseña
        if password:
            user.set_password(password)

        # Manejo del rol
        user.rol = rol
        if rol == 'admin':
            user.is_staff = True

        user.save()
        return user

    def update(self, instance, validated_data):
        """
        Se llama al actualizar un usuario (PUT/PATCH).
        Maneja la lógica de set_password y rol si cambian.
        """
        password = validated_data.pop('password', None)
        rol = validated_data.get('rol', instance.rol)

        instance = super().update(instance, validated_data)

        if password:
            instance.set_password(password)

        instance.rol = rol
        if rol == 'admin':
            instance.is_staff = True
        else:
            instance.is_staff = False  #Quitas el staff al cambiar de rol
        instance.save()

        return instance
