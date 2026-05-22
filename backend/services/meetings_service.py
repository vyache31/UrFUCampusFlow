from models import Meetings
from repositories.meetings_repository import MeetingsRepository
from services.microsoft_oauth_service import MicrosoftOAuthService
from integrations.microsoft_graph_client import GraphClient
from schemas.outlook_meetings import MeetingCreate, MeetingResponse, MeetingUpdate
import uuid


class MeetingsService:
    def __init__(
            self,
            meetings_repo: MeetingsRepository,
            graph_client: GraphClient,
            oauth_service: MicrosoftOAuthService
        ):
        self.meetings_repo = meetings_repo
        self.graph_client = graph_client
        self.oauth_service = oauth_service


    @staticmethod
    def _handle_meeting_data(meeting_data: MeetingCreate) -> dict:
        return MeetingsService._build_graph_event_data(
            title=meeting_data.title,
            notes=meeting_data.notes,
            start_at=meeting_data.start_at,
            end_at=meeting_data.end_at,
            location=meeting_data.location,
            event_link=meeting_data.event_link
        )


    @staticmethod
    def _build_graph_event_data(
            title: str,
            notes: str | None,
            start_at,
            end_at,
            location: str | None,
            event_link: str
    ) -> dict:
        data = {
            "subject": title,
            "body": {
                "contentType": "HTML",
                "content": notes
            },
            "start": {
                "dateTime": str(start_at.isoformat()),
                "timeZone": "Ekaterinburg Standard Time"
            },
            "end": {
                "dateTime": str(end_at.isoformat()),
                "timeZone": "Ekaterinburg Standard Time"
            },
            "location":{
                "displayName": location or ""
            },
            "onlineMeetingUrl": event_link,
            "isOnlineMeeting": False
        }

        return data


    @staticmethod
    def _has_calendar_conflicts(events: list[dict], ignored_event_id: str | None = None) -> bool:
        for event in events:
            if ignored_event_id and event.get('id') == ignored_event_id:
                continue
            if event.get('isCancelled'):
                continue
            if event.get('showAs') == 'free':
                continue

            return True

        return False


    async def _build_headers(self, user_id: str) -> dict:
        access_token = await self.oauth_service.get_actual_access_token(user_id)

        return {"Authorization": f"Bearer {access_token}"}


    async def create_meeting(self, user_id: str, current_team_case_history_id: str, meeting_data: MeetingCreate) -> MeetingResponse:
        headers = await self._build_headers(user_id)

        correct_timeline = meeting_data.start_at < meeting_data.end_at

        if not correct_timeline:
            raise ValueError('Meeting start time should be earlier than ending time')

        calendar_view = await self.graph_client.list_calendar_view(
            params={
                'startDateTime': str(meeting_data.start_at.isoformat()),
                'endDateTime': str(meeting_data.end_at.isoformat())
            },
            headers=headers
        )

        events = calendar_view.get('value', [])
        if self._has_calendar_conflicts(events):
            raise ValueError('This time slot is not empty. Try another time.')

        payload = await self.graph_client.create_event(
            event_info=self._handle_meeting_data(meeting_data),
            headers=headers
        )

        created_meeting = Meetings(
            id = str(uuid.uuid4()),
            team_case_history_id = current_team_case_history_id,
            title = meeting_data.title,
            location = meeting_data.location,
            start_at = meeting_data.start_at,
            end_at = meeting_data.end_at,
            outlook_event_id = payload['id'],
            event_link = meeting_data.event_link,
            notes = meeting_data.notes,
            timezone = meeting_data.timezone
        )

        meeting = await self.meetings_repo.create(created_meeting)

        return self.to_response(meeting)


    async def update_meeting(
            self,
            user_id: str,
            current_team_case_history_id: str,
            meeting_id: str,
            meeting_data: MeetingUpdate
    ) -> MeetingResponse | None:
        meeting = await self.meetings_repo.get_by_id(meeting_id)

        if not meeting or meeting.team_case_history_id != current_team_case_history_id:
            return None

        update_data = meeting_data.model_dump(exclude_unset=True)

        if not update_data:
            return self.to_response(meeting)

        for field in ('title', 'start_at', 'end_at', 'event_link'):
            if field in update_data and update_data[field] is None:
                raise ValueError(f'{field} can not be empty')

        start_at = update_data.get('start_at', meeting.start_at)
        end_at = update_data.get('end_at', meeting.end_at)

        if start_at >= end_at:
            raise ValueError('Meeting start time should be earlier than ending time')

        headers = await self._build_headers(user_id)

        if 'start_at' in update_data or 'end_at' in update_data:
            calendar_view = await self.graph_client.list_calendar_view(
                params={
                    'startDateTime': str(start_at.isoformat()),
                    'endDateTime': str(end_at.isoformat())
                },
                headers=headers
            )

            events = calendar_view.get('value', [])
            if self._has_calendar_conflicts(events, ignored_event_id=meeting.outlook_event_id):
                raise ValueError('This time slot is not empty. Try another time.')

        title = update_data.get('title', meeting.title)
        location = update_data.get('location', meeting.location)
        event_link = update_data.get('event_link', meeting.event_link)
        notes = update_data.get('notes', meeting.notes)

        await self.graph_client.update_event(
            event_id=meeting.outlook_event_id,
            event_info=self._build_graph_event_data(
                title=title,
                notes=notes,
                start_at=start_at,
                end_at=end_at,
                location=location,
                event_link=event_link
            ),
            headers=headers
        )

        meeting.title = title
        meeting.location = location
        meeting.start_at = start_at
        meeting.end_at = end_at
        meeting.event_link = event_link
        meeting.notes = notes

        meeting = await self.meetings_repo.update(meeting)

        return self.to_response(meeting)


    async def delete_meeting(
            self,
            user_id: str,
            current_team_case_history_id: str,
            meeting_id: str
    ) -> bool | None:
        meeting = await self.meetings_repo.get_by_id(meeting_id)

        if not meeting or meeting.team_case_history_id != current_team_case_history_id:
            return None

        headers = await self._build_headers(user_id)

        await self.graph_client.delete_event(
            event_id=meeting.outlook_event_id,
            headers=headers
        )

        await self.meetings_repo.delete(meeting)

        return True


    async def get_by_team_case_history_id(self, team_case_history_id: str) -> list[MeetingResponse]:
        meetings = await self.meetings_repo.get_by_team_case_history_id(team_case_history_id)

        return [
            self.to_response(meeting)
            for meeting in meetings
        ]

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
            timezone=meeting.timezone
        )
