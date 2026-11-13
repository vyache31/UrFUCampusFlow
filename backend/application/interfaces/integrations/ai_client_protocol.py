from collections.abc import Sequence
from typing import Protocol

from application.schemas.ai import AIAssistantMessage, AIMessage


class AIClientProtocol(Protocol):
    async def generate_reply(
        self, messages: Sequence[AIMessage]
    ) -> AIAssistantMessage:
        ...

    async def generate_summary(
        self, messages: Sequence[AIMessage], summary: str | None = None
    ) -> str:
        ...
