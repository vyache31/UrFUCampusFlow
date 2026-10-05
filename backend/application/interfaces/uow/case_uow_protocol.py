from types import TracebackType
from typing import Protocol, Self

from application.interfaces.repositories import (
    CaseRepositoryProtocol,
    CaseSemestersRepositoryProtocol,
    CaseStatusRepositoryProtocol,
    SemestersRepositoryProtocol,
    UserRepositoryProtocol,
    UniversityInfoRepositoryProtocol,
    DifficultyLevelRepositoryProtocol,
)


class CaseUoWProtocol(Protocol):
    case_repository: CaseRepositoryProtocol
    case_semesters_repository: CaseSemestersRepositoryProtocol
    case_statuses_repository: CaseStatusRepositoryProtocol
    semesters_repository: SemestersRepositoryProtocol
    user_repository: UserRepositoryProtocol
    university_info_repository: UniversityInfoRepositoryProtocol
    difficulty_level_repository: DifficultyLevelRepositoryProtocol

    async def __aenter__(self) -> Self:
        ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        ...

    async def commit(self) -> None:
        ...

    async def rollback(self) -> None:
        ...
