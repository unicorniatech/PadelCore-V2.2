from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import async_to_sync

class JugadorConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Obtener user de la scope si estás usando AuthMiddleware
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close()
        else:
            # Creamos un “grupo” único para este user, p. ej. "jugador_<id>"
            group_name = f"jugador_{user.id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        user = self.scope["user"]
        group_name = f"jugador_{user.id}"
        await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Manejo de mensajes si el jugador manda algo
        pass

    # Método para recibir eventos group_send
    async def jugador_message(self, event):
        # ‘event’ podría tener { "type": "jugador_message", "data": {...} }
        await self.send_json(event["data"])