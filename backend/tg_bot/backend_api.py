import httpx
from config import settings

headers = {
    "Authorization": f"Bearer {settings.BOT_JWT}"
}

class BackendAPI:

    def __init__(self, base_url: str):
        self.base_url = base_url

    async def get_mode(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/mode",
                headers=headers
            )

            response.raise_for_status()

            return response.json()

    async def get_cases(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/cases",
                headers=headers
            )

            response.raise_for_status()

            return response.json()

    async def get_case(self, case_id: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/cases/{case_id}",
                headers=headers
            )
            response.raise_for_status()
            return response.json()

    async def get_bot_case_by_case_id(self, case_id: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/cases/{case_id}",
                headers=headers
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
                headers=headers
            )

            response.raise_for_status()

            return response.json()