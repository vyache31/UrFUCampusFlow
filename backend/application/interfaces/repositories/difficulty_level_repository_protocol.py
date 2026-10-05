from typing import Protocol

from infrastructure.db.models.cases import DifficultyLevels


class DifficultyLevelRepositoryProtocol(Protocol):
    async def get_by_id(self, level_id: int) -> DifficultyLevels | None:
        ...
