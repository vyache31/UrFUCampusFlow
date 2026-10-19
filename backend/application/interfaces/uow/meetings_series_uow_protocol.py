from typing import Protocol

from application.interfaces.repositories import (
    MeetingsRepositoryProtocol,
    MeetingsSeriesRepositoryProtocol,
    TeamCaseHistoryRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class MeetingsSeriesUoWProtocol(UoWProtocol, Protocol):
    meetings_series_repository: MeetingsSeriesRepositoryProtocol
    meetings_repository: MeetingsRepositoryProtocol
    team_case_history_repository: TeamCaseHistoryRepositoryProtocol
