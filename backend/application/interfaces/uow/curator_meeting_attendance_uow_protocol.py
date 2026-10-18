from typing import Protocol

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    CuratorMeetingsAttendanceRepositoryProtocol,
    MeetingsRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class CuratorMeetingAttendanceUoWProtocol(UoWProtocol, Protocol):
    attendance_repository: CuratorMeetingsAttendanceRepositoryProtocol
    meetings_repository: MeetingsRepositoryProtocol
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol
