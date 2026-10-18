from typing import Protocol

from infrastructure.db.models.cases import CaseSemesters


class CaseSemestersRepositoryProtocol(Protocol):
    async def get_by_case_and_semester(
        self,
        case_id: str,
        semester_id: int,
    ) -> CaseSemesters | None:
        ...

    async def create(self, case_semesters: CaseSemesters) -> CaseSemesters:
        ...

    async def get_by_id(
        self,
        case_semesters_id: str,
    ) -> CaseSemesters | None:
        ...
