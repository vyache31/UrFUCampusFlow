from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import (
    MeetingsRepositoryProtocol,
    MeetingsSeriesRepositoryProtocol,
    S3FilesCleanupRepositoryProtocol,
    S3FilesRepositoryProtocol,
    TeamCaseHistoryRepositoryProtocol,
)
from infrastructure.db.repositories import (
    MeetingsRepository,
    MeetingsSeriesRepository,
    S3FilesCleanUpRepository,
    S3FilesRepository,
    TeamCaseHistoryRepository,
)


class SqlAlchemyMeetingsSeriesUoW:
    meetings_series_repository: MeetingsSeriesRepositoryProtocol
    meetings_repository: MeetingsRepositoryProtocol
    team_case_history_repository: TeamCaseHistoryRepositoryProtocol
    s3_files_repository: S3FilesRepositoryProtocol
    s3_files_cleanup_repository: S3FilesCleanupRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.meetings_series_repository = MeetingsSeriesRepository(self.session)
        self.meetings_repository = MeetingsRepository(self.session)
        self.s3_files_repository = S3FilesRepository(self.session)
        self.s3_files_cleanup_repository = S3FilesCleanUpRepository(self.session)
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
