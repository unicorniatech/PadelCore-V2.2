# AppV1/AppV1/routing.py
from aprobaciones.routing import websocket_urlpatterns as aprobaciones_ws
# Si tuvieras otra app, importas su routing aquí: from usuarios.routing import ...
# from partidos.routing import ...

# Combinas:
websocket_urlpatterns = []
websocket_urlpatterns += aprobaciones_ws
# websocket_urlpatterns += usuarios_ws
# websocket_urlpatterns += partidos_ws

