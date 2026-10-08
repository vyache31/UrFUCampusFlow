import uuid

from infrastructure.db.models import CuratorMeetingsAttendance
from application.interfaces.uow.curator_meeting_attendance_uow_protocol import CuratorMeetingAttendanceUoWProtocol
from application.interfaces.uow.meetings_uow_protocol import MeetingsUoWProtocol
from presentation.api.schemas.curators_schemas import (
    CuratorMeetingAttendanceResponse,
    CuratorMeetingAttendanceUpdate,
)


class CuratorMeetingAttendanceService:
    def __init__(self, uow: CuratorMeetingAttendanceUoWProtocol) -> None:
        self.uow = uow

    async def create_default_for_meeting(
        self, meeting_id: str
    ) -> list[CuratorMeetingAttendanceResponse]:
        async with self.uow as uow:
            result = await self.create_default_for_meeting_in_uow(uow, meeting_id)
            await uow.commit()
            return result

    @staticmethod
    async def create_default_for_meeting_in_uow(
        uow: CuratorMeetingAttendanceUoWProtocol | MeetingsUoWProtocol,
        meeting_id: str,
    ) -> list[CuratorMeetingAttendanceResponse]:
        meeting = await uow.meetings_repository.get_by_id(meeting_id)

        if not meeting:
            raise ValueError("This meeting not found")

        current_assignments = await (
            uow.curator_assignments_repository.get_current_by_team_case_history_id(
                meeting.team_case_history_id
            )
        )
        existing_attendances = await uow.attendance_repository.get_by_meeting_id(
            meeting_id
        )
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
            await uow.attendance_repository.create_many(new_attendances)

        attendances = existing_attendances + new_attendances

        return [
            CuratorMeetingAttendanceService._to_response(attendance)
            for attendance in attendances
        ]

    async def get_by_id(
        self, attendance_id: str
    ) -> CuratorMeetingAttendanceResponse:
        async with self.uow as uow:
            attendance = await uow.attendance_repository.get_by_id(attendance_id)
            if not attendance:
                raise ValueError("Curator meeting attendance not found")
            return self._to_response(attendance)

    async def get_by_meeting_id(
        self, meeting_id: str, current_team_case_history_id: str
    ) -> list[CuratorMeetingAttendanceResponse]:
        async with self.uow as uow:
            meeting = await uow.meetings_repository.get_by_id(meeting_id)
            if not meeting or meeting.team_case_history_id != current_team_case_history_id:
                raise ValueError("Meeting not found")
            attendances = await uow.attendance_repository.get_by_meeting_id(meeting_id)
            return [self._to_response(attendance) for attendance in attendances]

    async def get_by_curator_assignment_id(
        self, curator_assignment_id: str
    ) -> list[CuratorMeetingAttendanceResponse]:
        async with self.uow as uow:
            attendances = await uow.attendance_repository.get_by_curator_assignment_id(
                curator_assignment_id
            )
            return [self._to_response(attendance) for attendance in attendances]

    async def get_by_meeting_and_curator_assignment(
        self, meeting_id: str, curator_assignment_id: str
    ) -> CuratorMeetingAttendanceResponse:
        async with self.uow as uow:
            attendance = await uow.attendance_repository.get_by_meeting_and_curator_assignment(
                meeting_id=meeting_id,
                curator_assignment_id=curator_assignment_id,
            )
            if not attendance:
                raise ValueError("Curator meeting attendance not found")
            return self._to_response(attendance)

    async def mark_attendance(
        self,
        meeting_id: str,
        current_team_case_history_id: str,
        attendance_id: str,
        schema: CuratorMeetingAttendanceUpdate,
    ) -> CuratorMeetingAttendanceResponse:
        async with self.uow as uow:
            meeting = await uow.meetings_repository.get_by_id(meeting_id)
            if not meeting or meeting.team_case_history_id != current_team_case_history_id:
                raise ValueError("Meeting not found")
            attendance = await uow.attendance_repository.get_by_id(attendance_id)
            if not attendance or attendance.meeting_id != meeting_id:
                raise ValueError("Curator meeting attendance not found")
            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)
            if "is_present" not in update_data:
                return self._to_response(attendance)
            attendance.is_present = update_data["is_present"]
            attendance = await uow.attendance_repository.update(attendance)
            response = self._to_response(attendance)
            await uow.commit()
            return response

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
