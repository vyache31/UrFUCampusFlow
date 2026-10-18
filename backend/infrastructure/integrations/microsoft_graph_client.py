from datetime import datetime
from typing import NoReturn

import httpx

from config import settings
from infrastructure.integrations.microsoft_graph_mapper import MicrosoftGraphMapper
from presentation.api.schemas.meetings_series_schemas import MeetingsSeriesCreate
from presentation.api.schemas.outlook_meetings import MeetingCreate


class GraphClient:
    def __init__(self, session: httpx.AsyncClient, mapper: MicrosoftGraphMapper):
        self.session = session
        self.mapper = mapper

    @staticmethod
    def _build_headers(access_token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {access_token}"}

    @staticmethod
    def _raise_unexpected_response(payload: httpx.Response) -> NoReturn:
        payload.raise_for_status()
        raise RuntimeError(f"Unexpected Microsoft Graph status: {payload.status_code}")

    async def create_meeting(
        self, meeting_data: MeetingCreate, access_token: str
    ) -> dict:
        return await self.create_event(
            self.mapper.map_meeting(meeting_data), access_token
        )

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
        event_info = self.mapper.build_event_data(
            title, notes, start_at, end_at, location, event_link
        )
        return await self.update_event(event_id, event_info, access_token)

    async def create_series(
        self, series_data: MeetingsSeriesCreate, access_token: str
    ) -> dict:
        return await self.create_event(self.mapper.map_series(series_data), access_token)

    async def get_provider_user_info(self, access_token: str) -> dict:
        payload = await self.session.get(
            settings.OAUTH_MICROSOFT_ME_URL,
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 200:
            return payload.json()

        self._raise_unexpected_response(payload)

    async def create_event(self, event_info: dict, access_token: str) -> dict:
        payload = await self.session.post(
            settings.OAUTH_MICROSOFT_EVENTS_URL,
            json=event_info,
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 201:
            return payload.json()

        self._raise_unexpected_response(payload)

    async def update_event(
        self, event_id: str, event_info: dict, access_token: str
    ) -> dict:
        payload = await self.session.patch(
            f"{settings.OAUTH_MICROSOFT_EVENTS_URL}/{event_id}",
            json=event_info,
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 200:
            return payload.json()

        self._raise_unexpected_response(payload)

    async def delete_event(self, event_id: str, access_token: str) -> None:
        payload = await self.session.delete(
            f"{settings.OAUTH_MICROSOFT_EVENTS_URL}/{event_id}",
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 204:
            return None

        self._raise_unexpected_response(payload)

    async def list_calendar_view(self, params: dict, access_token: str) -> dict:
        payload = await self.session.get(
            settings.OAUTH_MICROSOFT_CALENDAR_VIEW_URL,
            params=params,
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 200:
            return payload.json()

        self._raise_unexpected_response(payload)

    async def get_series_instances(
        self, series_id: str, params: dict, access_token: str
    ) -> dict:
        payload = await self.session.get(
            f"{settings.OAUTH_MICROSOFT_EVENTS_URL}/{series_id}/instances",
            params=params,
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 200:
            return payload.json()

        self._raise_unexpected_response(payload)

    async def delete_series(self, series_id: str, access_token: str) -> None:
        payload = await self.session.delete(
            f"{settings.OAUTH_MICROSOFT_EVENTS_URL}/{series_id}",
            headers=self._build_headers(access_token),
        )

        if payload.status_code == 204:
            return None

        self._raise_unexpected_response(payload)
