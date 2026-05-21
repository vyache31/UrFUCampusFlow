import httpx
from config import settings


class GraphClient:

    def __init__(self, session: httpx.AsyncClient):
        self.session = session


    async def get_provider_user_info(self, headers):
        payload = await self.session.get(settings.OAUTH_MICROSOFT_ME_URL, headers=headers)

        if payload.status_code == 200:
            return payload.json()

        return payload.raise_for_status()


    async def create_event(self, event_info: dict, headers):
        payload = await self.session.post(
            settings.OAUTH_MICROSOFT_EVENTS_URL,
            json=event_info,
            headers=headers
        )

        if payload.status_code == 201:
            return payload.json()

        return payload.raise_for_status()


    async def list_calendar_view(self, params: dict, headers):
        payload = await self.session.get(
            settings.OAUTH_MICROSOFT_CALENDAR_VIEW_URL,
            params=params,
            headers=headers
        )

        if payload.status_code == 200:
            return payload.json()

        return payload.raise_for_status()
