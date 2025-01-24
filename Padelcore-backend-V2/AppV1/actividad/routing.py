from django.urls import re_path
from .consumers import ActividadConsumer

websocket_urlpatterns = [
    re_path(r'^ws/actividad/$', ActividadConsumer.as_asgi()),
]
