from typing import Self
from types import TracebackType
from application.interfaces.repositories import (
    BotRepositoryProtocol,
    UserRepositoryProtocol
)
from infrastructure.db.repositories import (
    BotRepository,
    UserRepository
)
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.database import SessionLocal, async_sessionmaker


class SqlAlchemyBotUoW:
    bot_repository: BotRepositoryProtocol
    user_repository: UserRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.bot_repository = BotRepository(self.session)
        self.user_repository = UserRepository(self.session)

        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        try:
            await self.rollback()
        finally:
            await self.session.close()

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
