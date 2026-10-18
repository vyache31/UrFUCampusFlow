from typing import Protocol

from application.interfaces.repositories import (
    CaseSemestersRepositoryProtocol,
    TeamCaseHistoryRepositoryProtocol,
    TeamRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class TeamCaseHistoryUoWProtocol(UoWProtocol, Protocol):
    team_case_history_repository: TeamCaseHistoryRepositoryProtocol
    team_repository: TeamRepositoryProtocol
    case_semesters_repository: CaseSemestersRepositoryProtocol
