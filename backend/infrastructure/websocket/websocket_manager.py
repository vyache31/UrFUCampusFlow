import logging

from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from starlette.websockets import WebSocketState

from infrastructure.events.events import (
    CommentCreatedEvent,
    CommentUpdatedEvent,
    LikesUpdatedEvent
)


logger = logging.getLogger(__name__)


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
        dead_connections: set[WebSocket] = set()

        for websocket in tuple(self.channels):
            if (
                websocket.application_state != WebSocketState.CONNECTED
                or websocket.client_state == WebSocketState.DISCONNECTED
            ):
                dead_connections.add(websocket)
                continue

            try:
                await websocket.send_json(message)
            except (WebSocketDisconnect, RuntimeError) as error:
                logger.debug("Removing disconnected WebSocket: %s", error)
                dead_connections.add(websocket)

        for websocket in dead_connections:
            self.disconnect(websocket)

    async def on_comment_created(
            self,
            event: CommentCreatedEvent,
    ) -> None:

        await self.broadcast(
            {
                "type": "created_comment",
                "comment": event.comment.model_dump(mode='json')
            }
        )

    async def on_comment_updated(
            self,
            event: CommentUpdatedEvent,
    ) -> None:

        await self.broadcast(
            {
                "type": "update_comment",
                "comment": event.comment.model_dump(mode='json')
            }
        )

    async def on_likes_created(
            self,
            event: LikesUpdatedEvent,
    ) -> None:

        await self.broadcast(
            {
                "type": "reaction_updated",
                "like": event.likes.model_dump(mode='json')
            }
        )
