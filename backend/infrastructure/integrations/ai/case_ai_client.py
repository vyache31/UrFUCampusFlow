from config import settings
import httpx


class AIClient:
    def __init__(self, session: httpx.AsyncClient):
        self.session = session


    async def begin_generation(self, headers: dict, payload: dict) -> dict:
        response = await self.session.post(
            url=settings.GROQ_REQUEST_URL,
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            return response.json()

        return response.raise_for_status()
