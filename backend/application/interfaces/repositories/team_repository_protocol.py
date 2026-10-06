from typing import Protocol

from infrastructure.db.models import Teams


class TeamRepositoryProtocol(Protocol):
    async def get_by_id(self, team_id: str) -> Teams | None:
        ...
