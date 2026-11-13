from collections.abc import Sequence
from typing import Protocol

from presentation.api.schemas.ai import AIAssistantMessage, AIMessage


class AIClientProtocol(Protocol):
    def estimate_reply_input_tokens(self, messages: Sequence[AIMessage]) -> int:
        ...

    async def generate_reply(
        self, messages: Sequence[AIMessage]
    ) -> AIAssistantMessage:
        ...

    async def generate_summary(
        self,
        messages: Sequence[AIMessage],
        summary: str | None = None,
    ) -> str:
        ...
