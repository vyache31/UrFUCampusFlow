from infrastructure.db.models import Semesters
from application.interfaces.repositories.semesters_repository_protocol import SemestersRepositoryProtocol
from application.interfaces.uow.semesters_uow_protocol import SemestersUoWProtocol
from datetime import datetime, UTC


class SemestersService:

    def __init__(self, uow: SemestersUoWProtocol):
        self.uow = uow

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


    @classmethod
    async def get_or_create_for_date(
        cls, rep: SemestersRepositoryProtocol, target_date: datetime
    ) -> Semesters:
        period = cls._resolve_period_for_date(target_date)

        existing_semester = await rep.get_by_season_and_year(
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

        created_semester = await rep.create(new_semester)

        return created_semester


    async def get_or_create_current(self) -> Semesters:
        async with self.uow as uow:
            semester = await self.get_or_create_for_date(
                uow.semesters_repository, datetime.now(UTC)
            )
            await uow.commit()
            return semester
