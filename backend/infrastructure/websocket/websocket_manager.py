from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.channels: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.channels.add(websocket)


    def disconnect(self, websocket: WebSocket):
        self.channels.discard(websocket)

    async def broadcast(
            self,
            message: dict
    ):
        dead_connections = []

        for websocket in self.channels:
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.append(websocket)

        for ws in dead_connections:
            self.disconnect(ws)