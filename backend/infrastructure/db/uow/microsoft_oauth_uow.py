from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import MicrosoftOAuthRepositoryProtocol
from infrastructure.db.repositories import MicrosoftOAuthRepository


class SqlAlchemyMicrosoftOAuthUoW:
    microsoft_oauth_repository: MicrosoftOAuthRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.microsoft_oauth_repository = MicrosoftOAuthRepository(self.session)

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
