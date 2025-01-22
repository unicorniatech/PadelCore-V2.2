from rest_framework import viewsets
from .models import ActividadReciente
from .serializers import ActividadRecienteSerializer

# Create your views here.
class ActividadRecienteViewSet(viewsets.ReadOnlyModelViewSet):#Es sólo de lectura
    queryset = ActividadReciente.objects.all().order_by('-fecha')
    serializer_class = ActividadRecienteSerializer