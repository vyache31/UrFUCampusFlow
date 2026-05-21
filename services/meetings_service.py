from models import Meetings
from repositories.meetings_repository import MeetingsRepository
from services.microsoft_oauth_service import MicrosoftOAuthService
from integrations.microsoft_graph_client import GraphClient
from schemas.outlook_meetings import MeetingCreate


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
                "content": "Does mid month work for you?"
            },
            "start": {
                "dateTime": str(meeting_data.start_at),
                "timeZone": "Pacific Standard Time"
            },
            "end": {
                "dateTime": str(meeting_data.end_at),
                "timeZone": "Pacific Standard Time"
            },
            "location":{
                "displayName": meeting_data.location
            },
        }

        return data


    def _build_headers(self, user_id: str) -> dict:
        access_token = self.oauth_service.get_actual_access_token(user_id)

        return {"Authorization": f"Bearer {access_token}"}


    async def create_meeting(self, user_id: str, meeting_data: MeetingCreate) -> Meetings:
        headers = self._build_headers(user_id)

        payload = await self.graph_client.create_event(
            event_info=self._handle_meeting_data(meeting_data),
            headers=headers
        )

        return payload
