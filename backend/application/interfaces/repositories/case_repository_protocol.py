from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models.cases import Cases


class CaseRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[Cases]:
        ...

    async def get_by_id(self, case_id: str) -> Cases | None:
        ...

    async def create(self, case: Cases) -> Cases:
        ...

    async def get_with_relations(self, case_id: str) -> Cases:
        ...

    async def get_by_title(self, title: str) -> Cases | None:
        ...

    async def delete_by_id(self, case_id: str) -> None:
        ...
