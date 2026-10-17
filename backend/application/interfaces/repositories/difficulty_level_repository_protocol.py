from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models.cases import DifficultyLevels


class DifficultyLevelRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[DifficultyLevels]:
        ...

    async def get_by_id(self, level_id: int) -> DifficultyLevels | None:
        ...

    async def create(self, level: DifficultyLevels) -> DifficultyLevels:
        ...

    async def update(self, level: DifficultyLevels) -> DifficultyLevels:
        ...

    async def delete(self, level: DifficultyLevels) -> None:
        ...
