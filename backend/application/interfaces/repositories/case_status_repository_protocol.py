from typing import Protocol

from infrastructure.db.models.cases import CaseStatuses


class CaseStatusRepositoryProtocol(Protocol):
    async def get_by_code(self, status_code: str) -> CaseStatuses | None:
        ...
