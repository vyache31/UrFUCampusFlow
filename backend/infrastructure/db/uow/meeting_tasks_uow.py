from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    MeetingTaskRepositoryProtocol,
    MeetingsRepositoryProtocol,
    S3FilesRepositoryProtocol,
)
from infrastructure.db.repositories import (
    CuratorAssignmentsRepository,
    MeetingTaskRepository,
    MeetingsRepository,
    S3FilesRepository,
)


class SqlAlchemyMeetingTasksUoW:
    meeting_tasks_repository: MeetingTaskRepositoryProtocol
    meetings_repository: MeetingsRepositoryProtocol
    s3_files_repository: S3FilesRepositoryProtocol
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.meeting_tasks_repository = MeetingTaskRepository(self.session)
        self.meetings_repository = MeetingsRepository(self.session)
        self.s3_files_repository = S3FilesRepository(self.session)
        self.curator_assignments_repository = CuratorAssignmentsRepository(self.session)

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
