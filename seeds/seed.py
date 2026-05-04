import asyncio
from models.auth import Roles
from models.cases import CaseStatuses, DifficultyLevels
from models.grades import Iterations
from database import SessionLocal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from seeds.data import CASE_DIFFICULTY_LEVELS, CASE_STATUSES, ROLES, ITERATIONS


async def seed_dictionary(
        session: AsyncSession,
        model,
        items: list[dict]
) -> None:

    for item in items:
        existing_object = await session.scalar(
            select(model).where(model.code == item['code'])
        )

        if not existing_object:
            session.add(
                model(**item)
            )
            continue

        for key, value in item.items():
            setattr(existing_object, key, value)


async def seed_all_references() -> None:
    async with SessionLocal() as session_maker:
        await seed_dictionary(session_maker, CaseStatuses, CASE_STATUSES)
        await seed_dictionary(session_maker, DifficultyLevels, CASE_DIFFICULTY_LEVELS)
        await seed_dictionary(session_maker, Iterations, ITERATIONS)
        await seed_dictionary(session_maker, Roles, ROLES)

        await session_maker.commit()


if __name__ == "__main__":
    asyncio.run(seed_all_references())
