from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from application.interfaces.repositories import (
    CaseRepositoryProtocol,
    CaseSemestersRepositoryProtocol,
    CaseStatusRepositoryProtocol,
    SemestersRepositoryProtocol,
    UserRepositoryProtocol,
    UniversityInfoRepositoryProtocol,
    DifficultyLevelRepositoryProtocol,
    EvaluationRepositoryProtocol,
)
from infrastructure.db.repositories import (
    CaseRepository,
    CaseSemestersRepository,
    CaseStatusRepository,
    SemestersRepository,
    UserRepository,
    UniversityInfoRepository,
    DifficultyLevelRepository,
    EvaluationRepository,
)


class SqlAlchemyCaseUoW:
    case_repository: CaseRepositoryProtocol
    case_semesters_repository: CaseSemestersRepositoryProtocol
    case_statuses_repository: CaseStatusRepositoryProtocol
    semesters_repository: SemestersRepositoryProtocol
    user_repository: UserRepositoryProtocol
    university_info_repository: UniversityInfoRepositoryProtocol
    difficulty_level_repository: DifficultyLevelRepositoryProtocol
    evaluation_repository: EvaluationRepositoryProtocol

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self.session_factory = session_factory

    async def __aenter__(self) -> Self:
        self.session = self.session_factory()
        self.case_repository = CaseRepository(self.session)
        self.case_semesters_repository = CaseSemestersRepository(self.session)
        self.case_statuses_repository = CaseStatusRepository(self.session)
        self.semesters_repository = SemestersRepository(self.session)
        self.user_repository = UserRepository(self.session)
        self.university_info_repository = UniversityInfoRepository(self.session)
        self.difficulty_level_repository = DifficultyLevelRepository(self.session)
        self.evaluation_repository = EvaluationRepository(self.session)

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
