from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from models import Cases

CASE_LOAD_OPTIONS = (
    selectinload(Cases.difficulty_level),
    selectinload(Cases.university),
    selectinload(Cases.status),
    selectinload(Cases.creator),
)


class CaseRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 10):
        cases = await self.db.execute(
            select(Cases)
            .options(
                *CASE_LOAD_OPTIONS
            )
            .limit(limit=limit)
        )

        return cases.scalars().all()

    async def get_by_id(self, case_id: str) -> Cases | None:
        case = await self.db.execute(
            select(Cases)
            .options(
                *CASE_LOAD_OPTIONS
            )
            .where(Cases.id == case_id)
        )

        return case.scalar_one_or_none()

    async def get_with_relations(self, case_id: str) -> Cases:
        stmt = (
            select(Cases)
            .where(Cases.id == case_id)
            .options(
                selectinload(Cases.university),
                selectinload(Cases.status),
                selectinload(Cases.creator),
                selectinload(Cases.difficulty_level)
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create(self, case: Cases) -> Cases:
        self.db.add(case)
        await self.db.commit()

        return await self.get_by_id(case_id=str(case.id))

    async def delete(self, case: Cases) -> None:
        await self.db.delete(case)
        await self.db.commit()

    async def delete_by_id(self, case_id: str) -> None:
        await self.db.execute(
            delete(Cases).where(Cases.id == case_id)
        )

        await self.db.commit()

    async def update(self) -> None:
        await self.db.commit()

    async def get_by_creator(self, creator_id: str):
        cases = await self.db.execute(
            select(Cases)
            .options(
                *CASE_LOAD_OPTIONS
            )
            .where(Cases.creator_id == creator_id)
        )

        return cases.scalars().all()

    async def get_by_status(self, status_id: int):
        cases = await self.db.execute(
            select(Cases)
            .options(
                *CASE_LOAD_OPTIONS
            )
            .where(Cases.status_id == status_id)
        )

        return cases.scalars().all()

    async def get_by_title(self, title: str) -> Cases | None:
        case = await self.db.execute(
            select(Cases)
            .options(
                *CASE_LOAD_OPTIONS
            )
            .where(Cases.title == title)
        )

        return case.scalar_one_or_none()

    # async def verify_university(self, uni_id: int) -> bool:
    #     uni = await self.db.execute(
    #         select(Universities)
    #         .where(Universities.id == uni_id)
    #     )
    #
    #     return uni.scalar_one_or_none() is not None
    #
    #
    # async def verify_status(self, status_id: int) -> bool:
    #     status = await self.db.execute(
    #         select(CaseStatuses)
    #         .where(CaseStatuses.id == status_id)
    #     )
    #
    #     return status.scalar_one_or_none() is not None
    #
    #
    # async def verify_creator(self, creator_id: str) -> bool:
    #     creator = await self.db.execute(
    #         select(Users)
    #         .where(Users.id == creator_id)
    #     )
    #
    #     return creator.scalar_one_or_none() is not None
    #
    #
    # async def verify_difficulty_level(self, level_id: int) -> bool:
    #     level = await self.db.execute(
    #         select(DifficultyLevels)
    #         .where(DifficultyLevels.id == level_id)
    #     )
    #
    #     return level.scalar_one_or_none() is not None
