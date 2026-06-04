from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing_extensions import List

from models import Meetings

MEETING_LOAD_OPTIONS = (selectinload(Meetings.tasks),)


class MeetingsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, meeting: Meetings) -> Meetings:
        self.db.add(meeting)

        await self.db.commit()
        await self.db.refresh(meeting)

        return await self.get_by_id(meeting.id)

    async def create_many(self, meetings: list[Meetings]) -> list[Meetings]:
        self.db.add_all(meetings)
        await self.db.commit()

        return meetings

    async def update(self, meeting: Meetings) -> Meetings | None:

        await self.db.commit()
        await self.db.refresh(meeting)

        return meeting

    async def get_by_id(self, meeting_id: str) -> Meetings | None:

        meeting = await self.db.execute(
            select(Meetings)
            .options(*MEETING_LOAD_OPTIONS)
            .where(Meetings.id == meeting_id)
        )

        return meeting.scalar_one_or_none()

    async def get_by_start_date(self, start_date: datetime) -> list[Meetings] | None:

        meetings = await self.db.execute(
            select(Meetings)
            .options(*MEETING_LOAD_OPTIONS)
            .where(Meetings.start_at == start_date)
        )

        return meetings.scalars().all()

    async def get_by_team_case_history_id(
        self, team_case_history_id: str
    ) -> list[Meetings]:
        meetings = await self.db.execute(
            select(Meetings)
            .options(*MEETING_LOAD_OPTIONS)
            .where(Meetings.team_case_history_id == team_case_history_id)
        )

        return meetings.scalars().all()

    async def delete(self, meeting: Meetings) -> None:
        await self.db.delete(meeting)

        await self.db.commit()

    async def delete_by_id(self, meeting_id: str) -> None:
        await self.db.execute(delete(Meetings).where(Meetings.id == meeting_id))

        await self.db.commit()
