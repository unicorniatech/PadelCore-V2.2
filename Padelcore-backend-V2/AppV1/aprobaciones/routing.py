# aprobaciones/routing.py
from django.urls import re_path
from .consumers import AprobacionesConsumer

websocket_urlpatterns = [
    re_path(r'ws/aprobaciones/$', AprobacionesConsumer.as_asgi()),
]
