from typing import Protocol

from infrastructure.db.models import MeetingsSeries


class MeetingsSeriesRepositoryProtocol(Protocol):
    async def create(self, series: MeetingsSeries) -> MeetingsSeries:
        ...

    async def get_by_id(self, series_id: str) -> MeetingsSeries | None:
        ...

    async def get_by_team_case_history_id(
        self,
        team_case_history_id: str,
    ) -> list[MeetingsSeries]:
        ...

    async def delete_by_id(self, series_id: str) -> None:
        ...
