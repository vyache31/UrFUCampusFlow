from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import (
    TeamRepositoryProtocol,
    UniversityInfoRepositoryProtocol,
)
from infrastructure.db.repositories import TeamRepository, UniversityInfoRepository


class SqlAlchemyTeamUoW:
    team_repository: TeamRepositoryProtocol
    university_info_repository: UniversityInfoRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.team_repository = TeamRepository(self.session)
        self.university_info_repository = UniversityInfoRepository(self.session)

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
