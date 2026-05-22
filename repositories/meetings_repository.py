from models import Meetings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime


class MeetingsRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def create(self, meeting: Meetings) -> Meetings:
        self.db.add(meeting)

        await self.db.commit()
        await self.db.refresh(meeting)

        return meeting


    async def update(self, meeting: Meetings) -> Meetings | None:

        await self.db.commit()
        await self.db.refresh(meeting)

        return meeting


    async def get_by_id(self, meeting_id: str) -> Meetings | None:

        meeting = await self.db.execute(
            select(Meetings)
            .where(Meetings.id == meeting_id)
        )

        return meeting.scalar_one_or_none()


    async def get_by_start_date(self, start_date: datetime) -> list[Meetings] | None:

        meetings = await self.db.execute(
            select(Meetings)
            .where(Meetings.start_at == start_date)
        )

        return meetings.scalars().all()


    async def get_by_team_case_history_id(self, team_case_history_id: str) -> list[Meetings]:
        meetings = await self.db.execute(
            select(Meetings)
            .where(Meetings.team_case_history_id == team_case_history_id)
        )

        return meetings.scalars().all()


    async def delete(self, meeting: Meetings) -> None:
        await self.db.delete(meeting)

        await self.db.commit()


    async def delete_by_id(self, meeting_id: str) -> None:
        await self.db.execute(
            delete(Meetings)
            .where(Meetings.id == meeting_id)
        )

        await self.db.commit()
