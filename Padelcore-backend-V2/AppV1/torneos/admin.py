from django.contrib import admin
from .models import Torneo

# Register your models here.
@admin.register(Torneo)
class TorneoAdmin(admin.ModelAdmin):
    readonly_fields = ('createdT', 'modifiedT')  # Campos solo lectura en el panel de admin
    list_display = ('nombre', 'createdT', 'modifiedT')  # Columnas visibles en la lista
    date_hierarchy = 'createdT'
