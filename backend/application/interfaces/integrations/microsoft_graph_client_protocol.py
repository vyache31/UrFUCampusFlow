from typing import Protocol
from datetime import datetime

from presentation.api.schemas.meetings_series_schemas import MeetingsSeriesCreate
from presentation.api.schemas.outlook_meetings import MeetingCreate


class MicrosoftGraphClientProtocol(Protocol):
    async def create_meeting(
        self, meeting_data: MeetingCreate, access_token: str
    ) -> dict:
        ...

    async def update_meeting(
        self,
        event_id: str,
        title: str,
        notes: str | None,
        start_at: datetime,
        end_at: datetime,
        location: str | None,
        event_link: str | None,
        access_token: str,
    ) -> dict:
        ...

    async def create_series(
        self, series_data: MeetingsSeriesCreate, access_token: str
    ) -> dict:
        ...

    async def get_provider_user_info(
        self,
        access_token: str,
    ) -> dict:
        ...

    async def delete_event(
        self,
        event_id: str,
        access_token: str,
    ) -> None:
        ...

    async def list_calendar_view(
        self,
        params: dict,
        access_token: str,
    ) -> dict:
        ...

    async def get_series_instances(
        self,
        series_id: str,
        params: dict,
        access_token: str,
    ) -> dict:
        ...

    async def delete_series(
        self,
        series_id: str,
        access_token: str,
    ) -> None:
        ...
