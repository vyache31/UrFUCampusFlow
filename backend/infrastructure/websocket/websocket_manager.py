from fastapi import WebSocket

from infrastructure.events.events import (
    CommentCreatedEvent,
    LikesUpdatedEvent
)


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

    async def on_comment_created(
            self,
            event: CommentCreatedEvent,
    ) -> None:

        await self.broadcast(
            {
                "type": "created_comment",
                "comment": event.comment
            }
        )

    async def on_likes_created(
            self,
            event: LikesUpdatedEvent,
    ) -> None:

        await self.broadcast(
            {
                "type": "reaction_updated",
                "like": event.likes
            }
        )