from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import (
    StudentRepositoryProtocol,
    TeamMembersRepositoryProtocol,
    TeamRepositoryProtocol,
)
from infrastructure.db.repositories import (
    StudentRepository,
    TeamMembersRepository,
    TeamRepository,
)


class SqlAlchemyTeamMembersUoW:
    team_members_repository: TeamMembersRepositoryProtocol
    team_repository: TeamRepositoryProtocol
    student_repository: StudentRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.team_members_repository = TeamMembersRepository(self.session)
        self.team_repository = TeamRepository(self.session)
        self.student_repository = StudentRepository(self.session)

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
