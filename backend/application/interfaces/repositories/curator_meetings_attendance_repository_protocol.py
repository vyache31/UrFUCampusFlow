from typing import Protocol

from infrastructure.db.models import CuratorMeetingsAttendance


class CuratorMeetingsAttendanceRepositoryProtocol(Protocol):
    async def create_many(
        self,
        attendances: list[CuratorMeetingsAttendance],
    ) -> list[CuratorMeetingsAttendance]:
        ...

    async def get_by_id(
        self,
        attendance_id: str,
    ) -> CuratorMeetingsAttendance | None:
        ...

    async def get_by_meeting_id(
        self,
        meeting_id: str,
    ) -> list[CuratorMeetingsAttendance]:
        ...

    async def get_by_curator_assignment_id(
        self,
        curator_assignment_id: str,
    ) -> list[CuratorMeetingsAttendance]:
        ...

    async def get_by_meeting_and_curator_assignment(
        self,
        meeting_id: str,
        curator_assignment_id: str,
    ) -> CuratorMeetingsAttendance | None:
        ...

    async def update(
        self,
        attendance: CuratorMeetingsAttendance,
    ) -> CuratorMeetingsAttendance:
        ...
