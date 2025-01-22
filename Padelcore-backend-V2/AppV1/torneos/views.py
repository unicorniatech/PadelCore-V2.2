from rest_framework import viewsets
from .models import Torneo
from .serializers import TorneoSerializer

class TorneoViewSet(viewsets.ModelViewSet):
    queryset = Torneo.objects.all()
    serializer_class = TorneoSerializer

    def create(self, request, *args, **kwargs):
        print("Datos recibidos:", request.data)  # Muestra los datos en la terminal
        print("Errores:", self.serializer_class(data=request.data).is_valid(raise_exception=False))
        return super().create(request, *args, **kwargs)


#from django.shortcuts import render

# Create your views here.
#from rest_framework import viewsets
#from .models import Torneo
#from .serializers import TorneoSerializer

#class TorneoViewSet(viewsets.ModelViewSet):
#    queryset = Torneo.objects.all()
#    serializer_class = TorneoSerializer