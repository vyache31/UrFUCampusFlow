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