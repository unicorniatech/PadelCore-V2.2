import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ActividadConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Te suscribes a un grupo "actividad"
        await self.channel_layer.group_add("actividad", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("actividad", self.channel_name)

    async def receive(self, text_data):
        # Si deseas procesar mensajes del cliente al servidor
        pass

    # Función para manejar mensajes: "type": "actividad_message"
    async def actividad_message(self, event):
        data = event['data']
        # Mandamos el JSON al front
        await self.send(text_data=json.dumps(data))
