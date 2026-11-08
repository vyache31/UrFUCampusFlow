from datetime import UTC, datetime
from uuid import uuid4

from presentation.api.schemas.ai_case_schemas import (
    AIChatCreate,
    AIChatResponse,
    AIMessageResponse
)

from application.exceptions.ai import AIChatNotFoundError

from application.interfaces.uow.ai_chat_uow_protocol import AIChatUoWProtocol
from application.interfaces.integrations import AIClientProtocol
from infrastructure.db.models import AIChats


class AIChatService:

    def __init__(
        self,
        uow: AIChatUoWProtocol,
        ai_client: AIClientProtocol | None = None
    ) -> None:
        self.uow = uow
        self.client = ai_client

    async def create_chat(self, schema: AIChatCreate, user_id: str) -> AIChatResponse:

        async with self.uow as uow:
            chat = AIChats(
                id=str(uuid4()),
                user_id=user_id,
                title=schema.title,
                summary=None,
                summarized_through_position=0,
                created_at=datetime.now(UTC),
                updated_at=None
            )

            await uow.ai_chat_repository.create_chat(chat)

            await uow.commit()

            return self._to_response_chat(chat)

    async def get_chats(self, user_id: str, limit: int, offset: int) -> list[AIChatResponse]:
        async with self.uow as uow:

            chats = await uow.ai_chat_repository.get_all_by_user_id(
                user_id=user_id,
                limit=limit,
                offset=offset
            )

            return [self._to_response_chat(chat) for chat in chats]

    async def get_chat(self, chat_id: str, user_id: str) -> AIChatResponse:
        async with self.uow as uow:

            chat = await uow.ai_chat_repository.get_by_id_and_user_id(
                chat_id=chat_id,
                user_id=user_id
            )

            if not chat:
                raise AIChatNotFoundError(f'Chat with id {chat_id} for user with id {user_id} not found.')

            return self._to_response_chat(chat)

    async def get_messages(
        self, chat_id: str, user_id: str, limit: int, offset: int
    ) -> list[AIMessageResponse]:
        async with self.uow as uow:
            chat = await uow.ai_chat_repository.get_by_id_and_user_id(
                chat_id=chat_id,
                user_id=user_id,
            )

            if chat is None:
                raise AIChatNotFoundError(
                    f'Chat with id {chat_id} for user with id {user_id} not found.'
                )

            messages = await uow.ai_chat_repository.get_messages(
                chat_id=chat_id,
                limit=limit,
                offset=offset,
            )

            return [AIMessageResponse.model_validate(message) for message in messages]

    async def delete_chat(self, chat_id: str, user_id: str) -> None:
        async with self.uow as uow:
            chat = await uow.ai_chat_repository.get_by_id_and_user_id(
                chat_id=chat_id,
                user_id=user_id,
            )

            if chat is None:
                raise AIChatNotFoundError(
                    f'Chat with id {chat_id} for user with id {user_id} not found.'
                )

            await uow.ai_chat_repository.delete_chat(chat)
            await uow.commit()

    @staticmethod
    def _to_response_chat(chat: AIChats) -> AIChatResponse:
        return AIChatResponse(
            id=chat.id,
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at
        )
