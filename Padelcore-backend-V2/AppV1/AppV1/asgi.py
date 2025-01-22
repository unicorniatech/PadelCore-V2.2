"""
ASGI config for AppV1 project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from AppV1.routing import websecket_urlpatterns



os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AppV1.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(), # Manejo de peticiones HTTP
    "websocket": AuthMiddlewareStack( # Manejo de WebSockets
        URLRouter(
            websecket_urlpatterns # Rutas de WebSocket
        )
    ),
})



