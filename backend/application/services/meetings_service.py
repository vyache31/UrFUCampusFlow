import logging
import uuid

import httpx

from application.interfaces.integrations import (
    MicrosoftAccessTokenProviderProtocol,
    MicrosoftGraphClientProtocol,
)
from application.interfaces.uow.meetings_uow_protocol import MeetingsUoWProtocol
from infrastructure.db.models import Meetings, MeetingTask
from presentation.api.schemas.outlook_meetings import MeetingCreate, MeetingResponse, MeetingUpdate
from application.services.curator_meetings_attendance_service import CuratorMeetingAttendanceService


logger = logging.getLogger(__name__)


class MeetingsService:
    def __init__(
        self,
        uow: MeetingsUoWProtocol,
        graph_client: MicrosoftGraphClientProtocol,
        oauth_service: MicrosoftAccessTokenProviderProtocol,
    ):
        self.uow = uow
        self.graph_client = graph_client
        self.oauth_service = oauth_service

    @staticmethod
    def _has_calendar_conflicts(
        events: list[dict], ignored_event_id: str | None = None
    ) -> bool:
        for event in events:
            if ignored_event_id and event.get("id") == ignored_event_id:
                continue
            if event.get("isCancelled"):
                continue
            if event.get("showAs") == "free":
                continue

            return True

        return False

    @staticmethod
    def _is_missing_graph_event(err: httpx.HTTPStatusError) -> bool:
        if err.response.status_code in {404, 410}:
            return True

        try:
            error_code = err.response.json().get("error", {}).get("code")
        except ValueError:
            return False

        return error_code in {
            "ErrorItemNotFound",
            "Request_ResourceNotFound",
            "ResourceNotFound",
        }

    async def create_meeting(
        self,
        user_id: str,
        current_team_case_history_id: str,
        meeting_data: MeetingCreate,
    ) -> MeetingResponse:
        if meeting_data.start_at >= meeting_data.end_at:
            raise ValueError("Meeting start time should be earlier than ending time")
        async with self.uow as uow:
            history = await uow.team_case_history_repository.get_by_id(
                current_team_case_history_id
            )
            if history is None:
                raise ValueError("TeamCaseHistory entry not found")

            access_token = await self.oauth_service.get_actual_access_token(user_id)
            calendar_view = await self.graph_client.list_calendar_view(
                params={
                    "startDateTime": str(meeting_data.start_at.isoformat()),
                    "endDateTime": str(meeting_data.end_at.isoformat()),
                },
                access_token=access_token,
            )
            events = calendar_view.get("value", [])
            if self._has_calendar_conflicts(events):
                raise ValueError("This time slot is not empty. Try another time.")

            payload = await self.graph_client.create_meeting(
                meeting_data=meeting_data, access_token=access_token
            )
            created_meeting = Meetings(
                id=str(uuid.uuid4()),
                team_case_history_id=current_team_case_history_id,
                title=meeting_data.title,
                location=meeting_data.location,
                start_at=meeting_data.start_at,
                end_at=meeting_data.end_at,
                outlook_event_id=payload["id"],
                event_link=meeting_data.event_link or payload.get("webLink", ""),
                notes=meeting_data.notes,
                timezone=meeting_data.timezone,
            )
            created_meeting.tasks = [
                MeetingTask(
                    id=str(uuid.uuid4()),
                    title=task.title,
                    description=task.description,
                    is_completed=False,
                )
                for task in meeting_data.tasks
            ]
            meeting = await uow.meetings_repository.create(created_meeting)
            await CuratorMeetingAttendanceService.create_default_for_meeting_in_uow(
                uow, meeting.id
            )
            response = self.to_response(meeting)
            await uow.commit()
            return response

    async def update_meeting(
        self,
        user_id: str,
        current_team_case_history_id: str,
        meeting_id: str,
        meeting_data: MeetingUpdate,
    ) -> MeetingResponse | None:
        async with self.uow as uow:
            meeting = await uow.meetings_repository.get_by_id(meeting_id)
            if not meeting or meeting.team_case_history_id != current_team_case_history_id:
                return None

            update_data = meeting_data.model_dump(exclude_unset=True)
            if not update_data:
                return self.to_response(meeting)

            for field in ("title", "start_at", "end_at"):
                if field in update_data and update_data[field] is None:
                    raise ValueError(f"{field} can not be empty")

            start_at = update_data.get("start_at", meeting.start_at)
            end_at = update_data.get("end_at", meeting.end_at)
            if start_at >= end_at:
                raise ValueError("Meeting start time should be earlier than ending time")

            access_token = await self.oauth_service.get_actual_access_token(user_id)
            if "start_at" in update_data or "end_at" in update_data:
                calendar_view = await self.graph_client.list_calendar_view(
                    params={
                        "startDateTime": str(start_at.isoformat()),
                        "endDateTime": str(end_at.isoformat()),
                    },
                    access_token=access_token,
                )
                events = calendar_view.get("value", [])
                if self._has_calendar_conflicts(
                    events, ignored_event_id=meeting.outlook_event_id
                ):
                    raise ValueError("This time slot is not empty. Try another time.")

            title = update_data.get("title", meeting.title)
            location = update_data.get("location", meeting.location)
            event_link = update_data.get("event_link") or meeting.event_link
            notes = update_data.get("notes", meeting.notes)
            await self.graph_client.update_meeting(
                event_id=meeting.outlook_event_id,
                title=title,
                notes=notes,
                start_at=start_at,
                end_at=end_at,
                location=location,
                event_link=event_link,
                access_token=access_token,
            )

            meeting.title = title
            meeting.location = location
            meeting.start_at = start_at
            meeting.end_at = end_at
            meeting.event_link = event_link
            meeting.notes = notes
            meeting = await uow.meetings_repository.update(meeting)
            response = self.to_response(meeting)
            await uow.commit()
            return response

    async def delete_meeting(
        self, user_id: str, current_team_case_history_id: str, meeting_id: str
    ) -> bool | None:
        async with self.uow as uow:
            meeting = await uow.meetings_repository.get_by_id(meeting_id)
            if not meeting or meeting.team_case_history_id != current_team_case_history_id:
                return None

            access_token = await self.oauth_service.get_actual_access_token(user_id)
            try:
                await self.graph_client.delete_event(
                    event_id=meeting.outlook_event_id, access_token=access_token
                )
            except httpx.HTTPStatusError as err:
                if not self._is_missing_graph_event(err):
                    logger.error(
                        "Failed to delete Outlook event %s: %s %s",
                        meeting.outlook_event_id,
                        err.response.status_code,
                        err.response.text,
                    )
                    raise

            await uow.meetings_repository.delete(meeting)
            await uow.commit()
            return True

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[MeetingResponse]:
        async with self.uow as uow:
            meetings = await uow.meetings_repository.get_by_team_case_history_id(
                team_case_history_id
            )
            return [self.to_response(meeting) for meeting in meetings]

    async def get_by_id(self, meeting_id: str) -> Meetings | None:
        async with self.uow as uow:
            return await uow.meetings_repository.get_by_id(meeting_id)

    @staticmethod
    def to_response(meeting: Meetings) -> MeetingResponse:
        return MeetingResponse(
            id=meeting.id,
            title=meeting.title,
            location=meeting.location,
            team_case_history_id=meeting.team_case_history_id,
            start_at=meeting.start_at,
            end_at=meeting.end_at,
            outlook_event_id=meeting.outlook_event_id,
            event_link=meeting.event_link,
            notes=meeting.notes,
            timezone=meeting.timezone,
            tasks=meeting.tasks,
        )
