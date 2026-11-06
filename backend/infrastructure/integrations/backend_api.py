import httpx
from json import JSONDecodeError
from config import settings
from infrastructure.integrations.exceptions import BackendResponseError


def read_response(response: httpx.Response, expected_type: type, required_field: str | None = None):
    try:
        data = response.json()
    except JSONDecodeError as exc:
        raise BackendResponseError("Backend returned invalid JSON") from exc
    if not isinstance(data, expected_type):
        raise BackendResponseError("Backend returned an unexpected response type")
    items = data if isinstance(data, list) else [data]
    if required_field and any(
        not isinstance(item, dict) or not isinstance(item.get(required_field), str)
        for item in items
    ):
        raise BackendResponseError("Backend response is missing a required string field")
    return data

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

            self.token = read_response(response, dict, "access_token")["access_token"]

    async def _get_headers(self):
        if self.token is None:
            await self.init_service_token()

        return {
            "Authorization": f"Bearer {self.token}"
        }

    async def get_mode(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/mode",
                headers= await self._get_headers()
            )

            response.raise_for_status()

            return read_response(response, dict, "mode")

    async def get_cases(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/cases",
                headers= await self._get_headers()
            )

            response.raise_for_status()

            return read_response(response, list, "case_id")

    async def get_case(self, case_id: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/cases/{case_id}",
                headers= await self._get_headers()
            )
            response.raise_for_status()
            return read_response(response, dict)

    async def get_bot_case_by_case_id(self, case_id: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/bot/cases/{case_id}",
                headers= await self._get_headers()
            )
            response.raise_for_status()
            return read_response(response, dict, "id")

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

            return read_response(response, dict, "id")

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

                return read_response(response, type(None))
