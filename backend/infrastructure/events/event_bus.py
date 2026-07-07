from collections import defaultdict
from typing import Any, Awaitable, Callable, Type

EventHandler = Callable[[Any], Awaitable[None]]


class EventBus:
    def __init__(self):
        self._handlers: dict[Type, list[EventHandler]] = defaultdict(list)

    def subscribe(
        self,
        event_type: Type,
        handler: EventHandler,
    ) -> None:
        self._handlers[event_type].append(handler)

    async def publish(self, event: Any) -> None:
        handlers = self._handlers.get(type(event), [])

        for handler in handlers:
            await handler(event)