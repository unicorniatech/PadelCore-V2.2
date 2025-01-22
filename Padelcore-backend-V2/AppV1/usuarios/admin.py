from django.contrib import admin
from .models import Usuario
# Register your models here.

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    readonly_fields = ('createdU', 'modifiedU')  # Campos solo lectura en el panel de admin
    list_display = ('nombre_completo','email', 'createdU', 'modifiedU')  # Columnas visibles en la lista
    date_hierarchy = 'createdU'  # Navegación por fechas en el panel
