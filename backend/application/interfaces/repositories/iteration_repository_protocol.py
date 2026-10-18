from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models import Iterations


class IterationRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[Iterations]:
        ...

    async def get_by_id(self, iteration_id: int) -> Iterations | None:
        ...

    async def create(self, iteration: Iterations) -> Iterations:
        ...

    async def update(self, iteration: Iterations) -> Iterations:
        ...

    async def delete(self, iteration: Iterations) -> None:
        ...
