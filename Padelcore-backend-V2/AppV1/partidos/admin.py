from django.contrib import admin
from .models import Partido

@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    readonly_fields = ('createdP', 'modifiedP')  # Campos solo lectura en el panel de admin
    

    # Funciones personalizadas para mostrar los jugadores de cada equipo
    def equipo_1_display(self, obj):
        return ", ".join([usuario.nombre_completo for usuario in obj.equipo_1.all()])

    def equipo_2_display(self, obj):
        return ", ".join([usuario.nombre_completo for usuario in obj.equipo_2.all()])

    # Añadir funciones personalizadas a list_display
    list_display = ('equipo_1_display', 'equipo_2_display', 'fecha', 'hora', 'createdP', 'modifiedP')

    # Cambiar los nombres de las columnas mostradas en el admin
    equipo_1_display.short_description = "Equipo 1"
    equipo_2_display.short_description = "Equipo 2"

    # Navegación por fechas
    date_hierarchy = 'createdP'
