from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models.cases import CaseStatuses


class CaseStatusRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[CaseStatuses]:
        ...

    async def get_by_id(self, status_id: int) -> CaseStatuses | None:
        ...

    async def get_by_code(self, status_code: str) -> CaseStatuses | None:
        ...

    async def create(self, status: CaseStatuses) -> CaseStatuses:
        ...

    async def update(self, status: CaseStatuses) -> CaseStatuses:
        ...

    async def delete(self, status: CaseStatuses) -> None:
        ...
