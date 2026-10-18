from typing import Protocol

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
from application.interfaces.uow.uow_protocol import UoWProtocol


class CaseUoWProtocol(UoWProtocol, Protocol):
    case_repository: CaseRepositoryProtocol
    case_semesters_repository: CaseSemestersRepositoryProtocol
    case_statuses_repository: CaseStatusRepositoryProtocol
    semesters_repository: SemestersRepositoryProtocol
    user_repository: UserRepositoryProtocol
    university_info_repository: UniversityInfoRepositoryProtocol
    difficulty_level_repository: DifficultyLevelRepositoryProtocol
    evaluation_repository: EvaluationRepositoryProtocol
