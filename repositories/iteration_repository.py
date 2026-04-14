from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Iterations


class IterationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 10) -> list[Iterations]:
        iterations = await self.db.execute(
            select(Iterations)
            .limit(limit)
        )

        return iterations.scalars().all()

    async def get_by_id(self, iteration_id: int) -> Iterations | None:
        iteration = await self.db.execute(
            select(Iterations)
            .where(Iterations.id == iteration_id)
        )

        return iteration.scalar_one_or_none()

    async def create(self, iteration: Iterations) -> Iterations:
        self.db.add(iteration)
        await self.db.commit()
        await self.db.refresh(iteration)

        return iteration

    async def update(self, iteration: Iterations) -> Iterations:
        await self.db.commit()
        await self.db.refresh(iteration)

        return iteration

    async def delete(self, iteration: Iterations) -> None:
        await self.db.delete(iteration)
        await self.db.commit()

    async def delete_by_id(self, iteration_id: int) -> None:
        await self.db.execute(
            delete(Iterations)
            .where(Iterations.id == iteration_id)
        )

        await self.db.commit()
