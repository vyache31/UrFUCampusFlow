from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import DifficultyLevels


class DifficultyLevelRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 10) -> list[DifficultyLevels]:
        levels = await self.db.execute(
            select(DifficultyLevels)
            .limit(limit)
        )

        return levels.scalars().all()

    async def get_by_id(self, level_id: int) -> DifficultyLevels | None:
        level = await self.db.execute(
            select(DifficultyLevels)
            .where(DifficultyLevels.id == level_id)
        )

        return level.scalar_one_or_none()

    async def create(self, level: DifficultyLevels) -> DifficultyLevels:
        self.db.add(level)
        await self.db.commit()
        await self.db.refresh(level)

        return level

    async def update(self, level: DifficultyLevels) -> DifficultyLevels:
        await self.db.commit()
        await self.db.refresh(level)

        return level

    async def delete(self, level: DifficultyLevels) -> None:
        await self.db.delete(level)
        await self.db.commit()

    async def delete_by_id(self, level_id: int) -> None:
        await self.db.execute(
            delete(DifficultyLevels)
            .where(DifficultyLevels.id == level_id)
        )

        await self.db.commit()
