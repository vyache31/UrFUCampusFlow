from typing import Protocol

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    CuratorMeetingsAttendanceRepositoryProtocol,
    MeetingsRepositoryProtocol,
    TeamCaseHistoryRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class MeetingsUoWProtocol(UoWProtocol, Protocol):
    meetings_repository: MeetingsRepositoryProtocol
    team_case_history_repository: TeamCaseHistoryRepositoryProtocol
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol
    attendance_repository: CuratorMeetingsAttendanceRepositoryProtocol
