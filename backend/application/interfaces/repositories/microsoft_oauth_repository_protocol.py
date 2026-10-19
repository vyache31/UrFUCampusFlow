from typing import Protocol

from infrastructure.db.models import MicrosoftOAuth


class MicrosoftOAuthRepositoryProtocol(Protocol):
    async def create_oauth(self, oauth: MicrosoftOAuth) -> MicrosoftOAuth:
        ...

    async def get_oauth_by_user_id(
        self,
        user_id: str,
    ) -> MicrosoftOAuth | None:
        ...

    async def get_oauth_by_provider_user_id(
        self,
        provider_user_id: str,
    ) -> MicrosoftOAuth | None:
        ...

    async def update_oauth(self, oauth: MicrosoftOAuth) -> None:
        ...
