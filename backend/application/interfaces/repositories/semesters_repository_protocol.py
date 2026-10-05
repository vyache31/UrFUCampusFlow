from typing import Protocol

from infrastructure.db.models.teams import Semesters


class SemestersRepositoryProtocol(Protocol):
    async def create(self, semester: Semesters) -> Semesters:
        ...

    async def get_by_season_and_year(self, season: str, year: int) -> Semesters | None:
        ...
