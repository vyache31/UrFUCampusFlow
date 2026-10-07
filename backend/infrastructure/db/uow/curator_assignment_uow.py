from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    TeamCaseHistoryRepositoryProtocol,
    UserRepositoryProtocol,
)
from infrastructure.db.repositories import (
    CuratorAssignmentsRepository,
    TeamCaseHistoryRepository,
    UserRepository,
)


class SqlAlchemyCuratorAssignmentUoW:
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol
    user_repository: UserRepositoryProtocol
    team_case_history_repository: TeamCaseHistoryRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.curator_assignments_repository = CuratorAssignmentsRepository(
            self.session
        )
        self.user_repository = UserRepository(self.session)
        self.team_case_history_repository = TeamCaseHistoryRepository(self.session)

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
