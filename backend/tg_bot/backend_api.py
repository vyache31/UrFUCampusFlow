import httpx
from config import settings

headers = {
    "Authorization": f"Bearer {settings.SERVICE_BOT_SECRET}"
}

class BackendAPI:

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token = None

    async def init_service_token(self):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/auth/service/login",
                json = {
                    'secret': settings.SERVICE_BOT_SECRET,
                    'service_name': 'telegram_bot'
                }
            )

            response.raise_for_status()

            self.token = response.json()["access_token"]

    async def _get_headers(self):
        if self.token is None:
            await self.init_service_token()

        return {
            "Authorization": f"Bearer {self.token}"
        }

    async def get_mode(self):
        async with httpx.AsyncClient() as client:
            print("LOG HEADERS:", await self._get_headers())
            response = await client.get(
                f"{self.base_url}/bot/mode",
                headers= await self._get_headers()
            )

            response.raise_for_status()

            return response.json()

    async def get_cases(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/cases",
                headers= await self._get_headers()
            )

            response.raise_for_status()

            return response.json()

    async def get_case(self, case_id: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/cases/{case_id}",
                headers= await self._get_headers()
            )
            response.raise_for_status()
            return response.json()

    async def get_bot_case_by_case_id(self, case_id: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/cases/{case_id}",
                headers= await self._get_headers()
            )
            response.raise_for_status()
            return response.json()

    async def create_interview(
        self,
        tg_user_id: int,
        case_id: str,
        team_name: str,
        date_time: str
    ):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/bot/interviews",
                json={
                    "tg_user_id": tg_user_id,
                    "case_id": case_id,
                    "team_name": team_name,
                    "date_time": date_time
                },
                headers= await self._get_headers()
            )

            response.raise_for_status()

            return response.json()

    async def can_book_date_time_interview(
                self,
                date_time: str
        ):
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/bot/interviews",
                    params={"date_time": date_time},
                    headers= await self._get_headers()
                )

                response.raise_for_status()

                return response.json()