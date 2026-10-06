from typing import Protocol

from infrastructure.db.models import TeamCaseHistory


class TeamCaseHistoryRepositoryProtocol(Protocol):
    async def create(self, team_case_history: TeamCaseHistory) -> TeamCaseHistory:
        ...

    async def get_by_id(self, team_case_history_id: str) -> TeamCaseHistory | None:
        ...

    async def get_by_team_id(self, team_id: str) -> list[TeamCaseHistory]:
        ...

    async def get_current_by_team_id(self, team_id: str) -> TeamCaseHistory | None:
        ...

    async def get_by_case_semester_id(
        self,
        case_semesters_id: str,
    ) -> list[TeamCaseHistory]:
        ...

    async def get_current_by_team_and_case_semester(
        self,
        team_id: str,
        case_semesters_id: str,
    ) -> TeamCaseHistory | None:
        ...

    async def update(self) -> None:
        ...

    async def delete(self, team_case_history: TeamCaseHistory) -> None:
        ...
