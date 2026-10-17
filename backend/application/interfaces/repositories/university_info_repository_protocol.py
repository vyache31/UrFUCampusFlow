from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models.teams import Universities


class UniversityInfoRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[Universities]:
        ...

    async def get_by_id(self, uni_id: int) -> Universities | None:
        ...

    async def create(self, university: Universities) -> Universities:
        ...

    async def update(self, university: Universities) -> Universities:
        ...

    async def delete(self, university: Universities) -> None:
        ...
