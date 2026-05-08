from sqlalchemy.ext.asyncio import AsyncSession
from models import Semesters
from datetime import datetime
from sqlalchemy import select


class SemestersRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def create(self, semester: Semesters) -> Semesters:
        self.db.add(semester)

        await self.db.commit()
        await self.db.refresh(semester)

        return semester


    async def get_by_year(self, year: int) -> list[Semesters]:
        semesters = await self.db.execute(
            select(Semesters)
            .where(Semesters.year == year)
        )

        return semesters.scalars().all()


    async def get_by_id(self, semester_id: int) -> Semesters | None:
        semester = await self.db.execute(
            select(Semesters)
            .where(Semesters.id == semester_id)
        )

        return semester.scalar_one_or_none()


    async def get_by_date(self, target_date: datetime) -> Semesters | None:
        semester = await self.db.execute(
            select(Semesters)
            .where(
                Semesters.start_date <= target_date,
                target_date <= Semesters.end_date
            )
        )

        return semester.scalar_one_or_none()


    async def get_by_season_and_year(self, season: str, year: int) -> Semesters | None:
        semester = await self.db.execute(
            select(Semesters)
            .where(
                Semesters.year == year,
                Semesters.season == season
            )
        )

        return semester.scalar_one_or_none()
