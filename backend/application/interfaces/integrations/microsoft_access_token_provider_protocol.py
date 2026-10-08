from typing import Protocol


class MicrosoftAccessTokenProviderProtocol(Protocol):
    async def get_actual_access_token(self, user_id: str) -> str:
        ...
