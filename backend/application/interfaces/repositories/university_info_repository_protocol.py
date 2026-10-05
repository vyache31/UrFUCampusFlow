from typing import Protocol

from infrastructure.db.models.teams import Universities


class UniversityInfoRepositoryProtocol(Protocol):
    async def get_by_id(self, uni_id: int) -> Universities | None:
        ...
