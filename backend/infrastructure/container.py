from infrastructure.events.event_bus import EventBus
from infrastructure.events.events import CommentCreatedEvent, LikesUpdatedEvent
from infrastructure.websocket.websocket_manager import WebSocketManager

event_bus = EventBus()
ws_manager = WebSocketManager()

event_bus.subscribe(
    CommentCreatedEvent,
    ws_manager.on_comment_created,
)

event_bus.subscribe(
    LikesUpdatedEvent,
    ws_manager.on_likes_updated,
)