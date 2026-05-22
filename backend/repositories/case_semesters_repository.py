from sqlalchemy import select
from models import CaseSemesters
from sqlalchemy.ext.asyncio import AsyncSession


class CaseSemestersRepository:
    def __init__(self, db: AsyncSession):
        self.db = db


    async def create(self, case_semesters: CaseSemesters) -> CaseSemesters:
        self.db.add(case_semesters)
        await self.db.commit()
        await self.db.refresh(case_semesters)

        return case_semesters


    async def get_by_case_and_semester(self, case_id: str, semester_id: int) -> CaseSemesters | None:
        case_semester = await self.db.execute(
            select(CaseSemesters)
            .where(
                CaseSemesters.semester_id == semester_id,
                CaseSemesters.case_id == case_id
            )
        )

        return case_semester.scalar_one_or_none()
