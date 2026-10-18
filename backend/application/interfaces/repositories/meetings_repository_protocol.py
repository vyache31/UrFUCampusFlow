from typing import Protocol

from infrastructure.db.models import Meetings


class MeetingsRepositoryProtocol(Protocol):
    async def create(self, meeting: Meetings) -> Meetings:
        ...

    async def create_many(self, meetings: list[Meetings]) -> list[Meetings]:
        ...

    async def update(self, meeting: Meetings) -> Meetings:
        ...

    async def get_by_id(self, meeting_id: str) -> Meetings | None:
        ...

    async def get_by_team_case_history_id(
        self,
        team_case_history_id: str,
    ) -> list[Meetings]:
        ...

    async def delete(self, meeting: Meetings) -> None:
        ...

    async def delete_by_series_id(self, series_id: str) -> None:
        ...
