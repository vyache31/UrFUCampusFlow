from typing import Protocol

from infrastructure.db.models.auth import Users


class UserRepositoryProtocol(Protocol):
    async def get_by_id(self, user_id: str, *, for_update: bool = False) -> Users | None:
        ...
