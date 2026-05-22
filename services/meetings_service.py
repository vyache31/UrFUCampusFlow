from models import Meetings
from repositories.meetings_repository import MeetingsRepository
from services.microsoft_oauth_service import MicrosoftOAuthService
from integrations.microsoft_graph_client import GraphClient
from schemas.outlook_meetings import MeetingCreate, MeetingResponse
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
        data = {
            "subject": meeting_data.title,
            "body": {
                "contentType": "HTML",
                "content": meeting_data.notes
            },
            "start": {
                "dateTime": str(meeting_data.start_at.isoformat()),
                "timeZone": "Ekaterinburg Standard Time"
            },
            "end": {
                "dateTime": str(meeting_data.end_at.isoformat()),
                "timeZone": "Ekaterinburg Standard Time"
            },
            "location":{
                "displayName": meeting_data.location
            },
            "onlineMeetingUrl": meeting_data.event_link,
            "isOnlineMeeting": False
        }

        return data


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
        if events:
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
