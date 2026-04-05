from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from models import Cases, CaseStatuses, DifficultyLevels, Universities, Users, Semesters



class CaseRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 10):
        cases = await self.db.execute(
            select(Cases)
            .options(
                selectinload(Cases.difficulty_level),
                selectinload(Cases.university),
                selectinload(Cases.semester),
                selectinload(Cases.status),
                selectinload(Cases.creator),
            )
            .limit(limit=limit)
        )

        return cases.scalars().all()

    async def get_by_id(self, case_id: str):
        case = await self.db.execute(
            select(Cases)
            .options(
                selectinload(Cases.difficulty_level),
                selectinload(Cases.university),
                selectinload(Cases.semester),
                selectinload(Cases.status),
                selectinload(Cases.creator),
            )
            .where(Cases.id == case_id)
        )

        return case.scalar_one_or_none()

    async def create(self, case: Cases):
        self.db.add(case)
        await self.db.commit()
        await self.db.refresh(case)

        return case

    async def delete(self, case: Cases):
        await self.db.delete(case)
        await self.db.commit()

    async def delete_by_id(self, case_id: str):
        await self.db.execute(
            delete(Cases).where(Cases.id == case_id)
        )

        await self.db.commit()

    async def update(self):
        await self.db.commit()

    async def get_by_creator(self, creator_id: str):
        cases = await self.db.execute(
            select(Cases)
            .options(
                selectinload(Cases.difficulty_level),
                selectinload(Cases.university),
                selectinload(Cases.semester),
                selectinload(Cases.status),
                selectinload(Cases.creator),
            )
            .where(Cases.creator_id == creator_id)
        )

        return cases.scalars().all()

    async def get_by_status(self, status_id: int):
        cases = await self.db.execute(
            select(Cases)
            .options(
                selectinload(Cases.difficulty_level),
                selectinload(Cases.university),
                selectinload(Cases.semester),
                selectinload(Cases.status),
                selectinload(Cases.creator),
            )
            .where(Cases.status_id == status_id)
        )

        return cases.scalars().all()

    async def get_by_title(self, title: str):
        case = await self.db.execute(
            select(Cases)
            .options(
                selectinload(Cases.difficulty_level),
                selectinload(Cases.university),
                selectinload(Cases.semester),
                selectinload(Cases.status),
                selectinload(Cases.creator),
            )
            .where(Cases.title == title)
        )

        return case.scalar_one_or_none()

    async def verify_university(self, uni_id):
        uni = await self.db.execute(
            select(Universities)
            .where(Universities.id == uni_id)
        )

        return True if uni.scalar_one_or_none() else False

    async def verify_status(self, status_id):
        status = await self.db.execute(
            select(CaseStatuses)
            .where(CaseStatuses.id == status_id)
        )

        return True if status.scalar_one_or_none() else False

    async def verify_creator(self, creator_id):
        creator = await self.db.execute(
            select(Users)
            .where(Users.id == creator_id)
        )

        return True if creator.scalar_one_or_none() else False

    async def verify_difficulty_level(self, level_id):
        level = await self.db.execute(
            select(DifficultyLevels)
            .where(DifficultyLevels.id == level_id)
        )

        return True if level.scalar_one_or_none() else False

    async def verify_semester(self, semester_id):
        semester = await self.db.execute(
            select(Semesters)
            .where(Semesters.id == semester_id)
        )

        return True if semester.scalar_one_or_none() else False