from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import MeetingsSeries

SERIES_LOAD_OPTIONS = (selectinload(MeetingsSeries.meetings),)


class MeetingsSeriesRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, series: MeetingsSeries) -> MeetingsSeries:
        self.db.add(series)

        await self.db.commit()
        await self.db.refresh(series)

        return await self.get_by_id(series.id)

    async def update(self, series: MeetingsSeries) -> MeetingsSeries | None:

        await self.db.commit()
        await self.db.refresh(series)

        return series

    async def get_by_id(self, series_id: str) -> MeetingsSeries | None:

        series = await self.db.execute(
            select(MeetingsSeries)
            .options(*SERIES_LOAD_OPTIONS)
            .where(MeetingsSeries.id == series_id)
        )

        return series.scalar_one_or_none()

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[MeetingsSeries]:
        series = await self.db.execute(
            select(MeetingsSeries)
            .options(*SERIES_LOAD_OPTIONS)
            .where(MeetingsSeries.team_case_history_id == team_case_history_id)
        )

        return series.scalars().all()

    async def delete(self, series: MeetingsSeries) -> None:
        await self.db.delete(series)

        await self.db.commit()

    async def delete_by_id(self, series_id: str) -> None:
        await self.db.execute(
            delete(MeetingsSeries).where(MeetingsSeries.id == series_id)
        )

        await self.db.commit()
