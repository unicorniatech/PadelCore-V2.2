# aprobaciones/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class AprobacionesConsumer(AsyncWebsocketConsumer):
    #Cada vez que un cliente (admin) se conecta, se une a un canal/grupo común llamado "aprobaciones".
    async def connect(self):
        # Grupo de canal, por ejemplo "aprobaciones"
        await self.channel_layer.group_add(
            "aprobaciones",  # nombre del grupo
            self.channel_name
        )
        await self.accept()
    #Al desconectarse, se quita del grupo.
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "aprobaciones",
            self.channel_name
        )

    async def receive(self, text_data):
        # Si el cliente envía mensajes por WS, podrías procesarlos aquí
        pass

    # Función para recibir mensajes desde channel_layer.group_send()
    async def aprobacion_message(self, event):
        """
        Manejar un mensaje de tipo 'aprobacion_message', 
        que contenga el objeto de la aprobación creada o actualizada
        """
        data = event['data']  # lo que envíes
        # Envías el JSON al front-end
        await self.send(text_data=json.dumps(data))
