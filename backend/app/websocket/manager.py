import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("weatherpulse.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message_type: str, data: Dict[str, Any]):
        """
        Broadcast JSON message to all connected clients.
        """
        payload = json.dumps({
            "type": message_type,
            "data": data
        })
        stale_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale)

manager = ConnectionManager()
