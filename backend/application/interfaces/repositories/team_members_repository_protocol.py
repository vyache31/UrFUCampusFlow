from typing import Protocol

from infrastructure.db.models import TeamMembers


class TeamMembersRepositoryProtocol(Protocol):
    async def create(self, team_member: TeamMembers) -> TeamMembers:
        ...

    async def get_by_id(self, team_member_id: str) -> TeamMembers | None:
        ...

    async def get_by_team_id(self, team_id: str) -> list[TeamMembers]:
        ...

    async def get_current_by_team_id(self, team_id: str) -> list[TeamMembers]:
        ...

    async def get_current_by_student_id(
        self,
        student_id: str,
    ) -> TeamMembers | None:
        ...

    async def get_current_by_team_and_student(
        self,
        team_id: str,
        student_id: str,
    ) -> TeamMembers | None:
        ...

    async def update(self) -> None:
        ...

    async def delete(self, team_member: TeamMembers) -> None:
        ...
