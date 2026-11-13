from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import httpx

from application.exceptions.ai import (
    AIChatNotFoundError,
    AIProviderError,
    AIProviderTimeoutError,
)
from application.exceptions.base import (
    ApplicationValidationError,
    ConfigurationError,
    ConflictError,
)
from application.interfaces.integrations import AIClientProtocol
from application.interfaces.uow.ai_chat_uow_protocol import AIChatUoWProtocol
from config import settings
from infrastructure.db.models import AIChats, AIMessages
from presentation.api.schemas.ai import (
    AIChatCreate,
    AIChatResponse,
    AIMessage,
    AIMessageCreate,
    AIMessageResponse,
)


class AIChatService:
    def __init__(
        self,
        uow: AIChatUoWProtocol,
        ai_client: AIClientProtocol | None = None,
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
                updated_at=None,
            )

            await uow.ai_chat_repository.create_chat(chat)

            await uow.commit()

            return self._to_response_chat(chat)

    async def get_chats(
        self,
        user_id: str,
        limit: int,
        offset: int,
    ) -> list[AIChatResponse]:
        async with self.uow as uow:
            chats = await uow.ai_chat_repository.get_all_by_user_id(
                user_id=user_id,
                limit=limit,
                offset=offset,
            )

            return [self._to_response_chat(chat) for chat in chats]

    async def get_chat(self, chat_id: str, user_id: str) -> AIChatResponse:
        async with self.uow as uow:
            chat = await uow.ai_chat_repository.get_by_id_and_user_id(
                chat_id=chat_id,
                user_id=user_id,
            )

            if not chat:
                raise AIChatNotFoundError(
                    f'Chat with id {chat_id} for user with id {user_id} not found.'
                )

            return self._to_response_chat(chat)

    async def get_messages(
        self,
        chat_id: str,
        user_id: str,
        limit: int,
        offset: int,
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
            chat = await uow.ai_chat_repository.get_for_update(
                chat_id=chat_id,
                user_id=user_id,
            )

            if chat is None:
                raise AIChatNotFoundError(
                    f'Chat with id {chat_id} for user with id {user_id} not found.'
                )

            await uow.ai_chat_repository.delete_chat(chat)
            await uow.commit()

    async def send_message(
        self,
        chat_id: str,
        user_id: str,
        schema: AIMessageCreate,
    ) -> AIMessageResponse:
        return await self._generate_reply(chat_id, user_id, schema)

    async def retry_reply(self, chat_id: str, user_id: str) -> AIMessageResponse:
        return await self._generate_reply(chat_id, user_id, None)

    async def _generate_reply(
        self,
        chat_id: str,
        user_id: str,
        schema: AIMessageCreate | None,
    ) -> AIMessageResponse:
        if self.client is None:
            raise ConfigurationError('AI client is not configured.')

        generation_id = str(uuid4())

        async with self.uow as uow:
            chat = await uow.ai_chat_repository.get_for_update(
                chat_id=chat_id,
                user_id=user_id,
            )

            if chat is None:
                raise AIChatNotFoundError(
                    f'Chat with id {chat_id} for user with id {user_id} not found.'
                )

            now = datetime.now(UTC)
            if (
                chat.generation_expires_at is not None
                and chat.generation_expires_at > now
            ):
                raise ConflictError('A reply is already being generated for this chat.')

            messages = await uow.ai_chat_repository.get_messages_after_position(
                chat_id=chat_id,
                position=chat.summarized_through_position,
            )

            pending_reply = bool(messages and messages[-1].role == 'user')
            if schema is not None and pending_reply:
                raise ConflictError(
                    'Retry the reply to the last message before sending a new one.'
                )

            if schema is None and not pending_reply:
                raise ConflictError('There is no unanswered message to retry.')

            history = [AIMessageResponse.model_validate(item) for item in messages]
            if schema is not None:
                position = await uow.ai_chat_repository.get_last_position(chat_id)
                message = AIMessages(
                    id=str(uuid4()),
                    chat_id=chat_id,
                    position=position + 1,
                    role='user',
                    content=schema.content,
                    created_at=now,
                )
                await uow.ai_chat_repository.add_message(message)
                history.append(AIMessageResponse.model_validate(message))

            chat.generation_id = generation_id
            chat.generation_expires_at = now + timedelta(
                seconds=settings.AI_GENERATION_TTL_SECONDS
            )
            chat.updated_at = now
            summary = chat.summary
            summary_position = chat.summarized_through_position
            await uow.commit()

        completed = False
        try:
            context = await self._prepare_context(
                chat_id,
                user_id,
                generation_id,
                history,
                summary,
                summary_position,
            )
            reply = await self.client.generate_reply(context)

            async with self.uow as uow:
                chat = await self._get_generation_chat(
                    uow, chat_id, user_id, generation_id
                )
                position = await uow.ai_chat_repository.get_last_position(chat_id)
                message = AIMessages(
                    id=str(uuid4()),
                    chat_id=chat_id,
                    position=position + 1,
                    role=reply.role,
                    content=reply.content,
                    created_at=datetime.now(UTC),
                )
                await uow.ai_chat_repository.add_message(message)

                chat.updated_at = message.created_at
                chat.generation_id = None
                chat.generation_expires_at = None

                result = AIMessageResponse.model_validate(message)

                await uow.commit()

                completed = True
                return result

        except httpx.TimeoutException as exc:
            raise AIProviderTimeoutError(
                'AI provider timed out. Retry the saved message.'
            ) from exc

        except httpx.HTTPError as exc:
            raise AIProviderError(
                'AI provider is unavailable. Retry the saved message.'
            ) from exc

        finally:
            if not completed:
                await self._release_generation(chat_id, user_id, generation_id)

    @staticmethod
    def _build_messages(
        messages: Sequence[AIMessageResponse],
        summary: str | None,
    ) -> list[AIMessage]:
        context: list[AIMessage] = []
        if summary:
            context.append(
                {
                    'role': 'user',
                    'content': f'Previous conversation summary:\n{summary}',
                }
            )

        context.extend(
            {'role': item.role, 'content': item.content} for item in messages
        )
        return context

    async def _prepare_context(
        self,
        chat_id: str,
        user_id: str,
        generation_id: str,
        history: Sequence[AIMessageResponse],
        summary: str | None,
        summary_position: int,
    ) -> list[AIMessage]:
        if self.client is None:
            raise ConfigurationError('AI client is not configured.')

        context = self._build_messages(history, summary)
        threshold = settings.AI_SUMMARY_TRIGGER_TOKENS
        if self.client.estimate_reply_input_tokens(context) <= threshold:
            return context

        cutoff = max(0, len(history) - (2 * settings.AI_SUMMARY_KEEP_PAIRS + 1))
        while cutoff > 0 and history[cutoff - 1].role != 'assistant':
            cutoff -= 1

        if cutoff == 0:
            raise ApplicationValidationError(
                'The recent messages exceed the input token budget. Shorten the message.'
            )

        new_summary = await self.client.generate_summary(
            messages=self._build_messages(history[:cutoff], None),
            summary=summary,
        )

        context = self._build_messages(history[cutoff:], new_summary)

        if self.client.estimate_reply_input_tokens(context) > threshold:
            raise ApplicationValidationError(
                'The summarized context exceeds the input token budget.'
            )

        async with self.uow as uow:
            chat = await self._get_generation_chat(uow, chat_id, user_id, generation_id)

            if chat.summarized_through_position != summary_position:
                raise ConflictError('The chat context changed during summarization.')

            chat.summary = new_summary
            chat.summarized_through_position = history[cutoff - 1].position

            await uow.commit()

        return context

    @staticmethod
    async def _get_generation_chat(
        uow: AIChatUoWProtocol,
        chat_id: str,
        user_id: str,
        generation_id: str,
    ) -> AIChats:
        chat = await uow.ai_chat_repository.get_for_update(chat_id, user_id)

        if chat is None:
            raise AIChatNotFoundError(f'Chat with id {chat_id} not found.')

        if chat.generation_id != generation_id:
            raise ConflictError(
                'This generation has been superseded by another operation.'
            )

        return chat

    async def _release_generation(
        self,
        chat_id: str,
        user_id: str,
        generation_id: str,
    ) -> None:
        async with self.uow as uow:
            chat = await uow.ai_chat_repository.get_for_update(chat_id, user_id)

            if chat is not None and chat.generation_id == generation_id:
                chat.generation_id = None
                chat.generation_expires_at = None

                await uow.commit()

    @staticmethod
    def _to_response_chat(chat: AIChats) -> AIChatResponse:
        return AIChatResponse(
            id=chat.id,
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
        )
