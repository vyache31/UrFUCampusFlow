from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import coalesce
from infrastructure.db.models import AIChats, AIMessages
from sqlalchemy import func, select


class AIChatRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_chat(self, chat: AIChats) -> AIChats:
        self.db.add(chat)

        await self.db.flush()
        await self.db.refresh(chat)

        return chat

    async def get_by_id_and_user_id(self, chat_id: str, user_id: str) -> AIChats | None:
        chat = await self.db.execute(
            select(AIChats)
            .where(AIChats.id == chat_id)
            .where(AIChats.user_id == user_id)
        )

        return chat.scalar_one_or_none()

    async def get_all_by_user_id(
        self, user_id: str, limit: int = 20, offset: int = 0
    ) -> Sequence[AIChats]:
        chats = await self.db.execute(
            select(AIChats)
            .where(AIChats.user_id == user_id)
            .order_by(
                coalesce(AIChats.updated_at, AIChats.created_at).desc(),
                AIChats.id.desc(),
            )
            .limit(limit)
            .offset(offset)
        )

        return chats.scalars().all()

    async def delete_chat(self, chat: AIChats) -> None:
        await self.db.delete(chat)

        await self.db.flush()

    async def add_message(self, message: AIMessages) -> AIMessages:
        self.db.add(message)
        await self.db.flush()

        return message

    async def get_messages(
        self, chat_id: str, limit: int = 50, offset: int = 0
    ) -> Sequence[AIMessages]:
        messages = await self.db.execute(
            select(AIMessages)
            .where(AIMessages.chat_id == chat_id)
            .order_by(AIMessages.position.asc())
            .limit(limit)
            .offset(offset)
        )

        return messages.scalars().all()

    async def get_last_position(self, chat_id: str) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(AIMessages.position), 0))
            .where(AIMessages.chat_id == chat_id)
        )

        return result.scalar_one()
