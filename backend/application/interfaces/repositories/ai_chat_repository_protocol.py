from typing import Protocol, Sequence
from infrastructure.db.models import AIChats, AIMessages


class AIChatRepositoryProtocol(Protocol):

    async def create_chat(self, chat: AIChats) -> AIChats:
        ...

    async def get_by_id_and_user_id(self, chat_id: str, user_id: str) -> AIChats | None:
        ...

    async def get_all_by_user_id(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> Sequence[AIChats]:
        ...

    async def delete_chat(self, chat: AIChats) -> None:
        ...

    async def add_message(self, message: AIMessages) -> AIMessages:
        ...

    async def get_messages(
        self, chat_id: str, limit: int = 50, offset: int = 0
    ) -> Sequence[AIMessages]:
        ...

    async def get_last_position(self, chat_id: str) -> int:
        ...
