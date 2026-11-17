from collections.abc import Sequence
from typing import Protocol

from presentation.api.schemas.ai import AICaseDraft, AIChatGenerationResult, AIMessage


class AIClientProtocol(Protocol):
    def estimate_reply_input_tokens(
        self,
        messages: Sequence[AIMessage],
        current_draft: AICaseDraft | None = None,
    ) -> int:
        ...

    async def generate_reply(
        self,
        messages: Sequence[AIMessage],
        current_draft: AICaseDraft | None = None,
    ) -> AIChatGenerationResult:
        ...

    async def generate_summary(
        self,
        messages: Sequence[AIMessage],
        summary: str | None = None,
    ) -> str:
        ...
