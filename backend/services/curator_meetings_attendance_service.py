import uuid

from models import CuratorMeetingsAttendance
from repositories.curator_assignments_repository import CuratorAssignmentsRepository
from repositories.curator_meetings_attendance_repository import (
    CuratorMeetingsAttendanceRepository,
)
from repositories.meetings_repository import MeetingsRepository
from schemas.curators_schemas import (
    CuratorMeetingAttendanceResponse,
    CuratorMeetingAttendanceUpdate,
)


class CuratorMeetingAttendanceService:
    def __init__(
        self,
        repo: CuratorMeetingsAttendanceRepository,
        curator_assignments_repo: CuratorAssignmentsRepository,
        meetings_repo: MeetingsRepository,
    ) -> None:
        self.repo = repo
        self.curator_assignments_repo = curator_assignments_repo
        self.meetings_repo = meetings_repo

    async def create_default_for_meeting(
        self, meeting_id: str
    ) -> list[CuratorMeetingAttendanceResponse]:
        meeting = await self.meetings_repo.get_by_id(meeting_id)

        if not meeting:
            raise ValueError("This meeting not found")

        current_assignments = await (
            self.curator_assignments_repo.get_current_by_team_case_history_id(
                meeting.team_case_history_id
            )
        )
        existing_attendances = await self.repo.get_by_meeting_id(meeting_id)
        existing_assignment_ids = {
            attendance.curator_assignment_id
            for attendance in existing_attendances
        }

        new_attendances = [
            CuratorMeetingsAttendance(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                curator_assignment_id=assignment.id,
                is_present=False
            )
            for assignment in current_assignments
            if assignment.id not in existing_assignment_ids
        ]

        if new_attendances:
            await self.repo.create_many(new_attendances)

        attendances = existing_attendances + new_attendances

        return [
            self._to_response(attendance)
            for attendance in attendances
        ]

    async def get_by_id(
        self, attendance_id: str
    ) -> CuratorMeetingAttendanceResponse:
        attendance = await self.repo.get_by_id(attendance_id)

        if not attendance:
            raise ValueError("Curator meeting attendance not found")

        return self._to_response(attendance)

    async def get_by_meeting_id(
        self, meeting_id: str
    ) -> list[CuratorMeetingAttendanceResponse]:
        attendances = await self.repo.get_by_meeting_id(meeting_id)

        return [
            self._to_response(attendance)
            for attendance in attendances
        ]

    async def get_by_curator_assignment_id(
        self, curator_assignment_id: str
    ) -> list[CuratorMeetingAttendanceResponse]:
        attendances = await self.repo.get_by_curator_assignment_id(
            curator_assignment_id
        )

        return [
            self._to_response(attendance)
            for attendance in attendances
        ]

    async def get_by_meeting_and_curator_assignment(
        self, meeting_id: str, curator_assignment_id: str
    ) -> CuratorMeetingAttendanceResponse:
        attendance = await self.repo.get_by_meeting_and_curator_assignment(
            meeting_id=meeting_id,
            curator_assignment_id=curator_assignment_id,
        )

        if not attendance:
            raise ValueError("Curator meeting attendance not found")

        return self._to_response(attendance)

    async def mark_attendance(
        self, attendance_id: str, schema: CuratorMeetingAttendanceUpdate
    ) -> CuratorMeetingAttendanceResponse:
        attendance = await self.repo.get_by_id(attendance_id)

        if not attendance:
            raise ValueError("Curator meeting attendance not found")

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        if "is_present" not in update_data:
            return self._to_response(attendance)

        attendance.is_present = update_data["is_present"]
        attendance = await self.repo.update(attendance)

        return self._to_response(attendance)

    @staticmethod
    def _to_response(
        attendance: CuratorMeetingsAttendance,
    ) -> CuratorMeetingAttendanceResponse:
        return CuratorMeetingAttendanceResponse(
            id=attendance.id,
            meeting_id=attendance.meeting_id,
            curator_assignment_id=attendance.curator_assignment_id,
            is_present=attendance.is_present,
        )
