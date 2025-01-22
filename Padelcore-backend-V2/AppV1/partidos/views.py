from rest_framework import viewsets
from .models import Partido
from .serializers import PartidoSerializer

class PartidoViewSet(viewsets.ModelViewSet):
    queryset = Partido.objects.all()
    serializer_class = PartidoSerializer
