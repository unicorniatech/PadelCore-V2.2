from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Config de campos, etc.
    fieldsets = (
        (None, {'fields': ('email','password','nombre_completo')}),
        ('Permissions', {'fields': ('is_staff','is_superuser','is_active','groups','user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email','nombre_completo','password1','password2','is_staff','is_superuser','is_active')}
        ),
    )
    list_display = ('email','nombre_completo','is_staff','is_active')
    search_fields = ('email','nombre_completo')
    ordering = ('email',)
