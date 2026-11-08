from collections.abc import Sequence
from typing import Literal, Protocol, TypedDict


class AIMessage(TypedDict):
    role: Literal["system", "user", "assistant"]
    content: str


class AIClientProtocol(Protocol):
    async def generate_reply(self, messages: Sequence[AIMessage]) -> str:
        ...
