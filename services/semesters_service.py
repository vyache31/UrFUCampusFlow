from repositories.semesters_repository import SemestersRepository
from models import Semesters
from datetime import datetime, UTC


class SemestersService:

    def __init__(self, rep: SemestersRepository):
        self.rep = rep

    @staticmethod
    def _resolve_period_for_date(target_date: datetime) -> dict:
        year = target_date.year
        month = target_date.month

        if month == 1:

            year -= 1

        if month <= 1 or month >= 8:
            return {
                'year': year,
                'season': 'FALL',
                'start_date': datetime(year, 8, 1, tzinfo=UTC),
                'end_date': datetime(year + 1, 2, 1, tzinfo=UTC),
            }

        return {
            'year': year,
            'season': 'SPRING',
            'start_date': datetime(year, 2, 1, tzinfo=UTC),
            'end_date': datetime(year, 8, 1, tzinfo=UTC),
        }


    async def get_or_create_for_date(self, target_date: datetime) -> Semesters:
        period = self._resolve_period_for_date(target_date)

        existing_semester = await self.rep.get_by_season_and_year(
            year=period['year'],
            season=period['season']
        )

        if existing_semester:
            return existing_semester

        new_semester = Semesters(
            year=period['year'],
            season=period['season'],
            start_date=period['start_date'],
            end_date=period['end_date']
        )

        created_semester = await self.rep.create(new_semester)

        return created_semester


    async def get_or_create_current(self) -> Semesters:
        return await self.get_or_create_for_date(datetime.now(UTC))
