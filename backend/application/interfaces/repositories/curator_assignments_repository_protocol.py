from typing import Protocol

from infrastructure.db.models import CuratorAssignment


class CuratorAssignmentsRepositoryProtocol(Protocol):
    async def create(
        self,
        curator_assignment: CuratorAssignment,
    ) -> CuratorAssignment:
        ...

    async def get_by_id(
        self,
        curator_assignment_id: str,
    ) -> CuratorAssignment | None:
        ...

    async def get_by_user_id(self, user_id: str) -> list[CuratorAssignment]:
        ...

    async def get_by_team_case_history_id(
        self,
        team_case_history_id: str,
    ) -> list[CuratorAssignment]:
        ...

    async def get_current_by_team_case_history_id(
        self,
        team_case_history_id: str,
    ) -> list[CuratorAssignment]:
        ...

    async def get_current_by_user_and_team_case_history(
        self,
        user_id: str,
        team_case_history_id: str,
    ) -> CuratorAssignment | None:
        ...

    async def update(
        self,
        curator_assignment: CuratorAssignment,
    ) -> CuratorAssignment:
        ...
