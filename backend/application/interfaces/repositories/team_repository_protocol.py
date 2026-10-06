from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models import Teams


class TeamRepositoryProtocol(Protocol):
    async def get_by_id(self, team_id: str) -> Teams | None:
        ...

    async def get_by_name(self, team_name: str) -> Teams | None:
        ...

    async def get_all(self, limit: int = 10) -> Sequence[Teams]:
        ...

    async def create(self, team: Teams) -> Teams:
        ...

    async def delete(self, team: Teams) -> None:
        ...

    async def update(self) -> None:
        ...
