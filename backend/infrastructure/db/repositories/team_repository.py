from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.models import Teams


class TeamRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, team_id: str) -> Teams | None:
        result = await self.db.execute(select(Teams).where(Teams.id == team_id))

        return result.scalar_one_or_none()

    async def get_by_name(self, team_name: str) -> Teams | None:
        result = await self.db.execute(select(Teams).where(Teams.name == team_name))

        return result.scalar_one_or_none()

    async def get_all(self, limit: int = 10) -> Sequence[Teams]:
        result = await self.db.execute(select(Teams).limit(limit))
        return result.scalars().all()

    async def create(self, team: Teams) -> Teams:
        self.db.add(team)
        await self.db.flush()
        await self.db.refresh(team)

        return team

    async def delete(self, team: Teams) -> None:
        await self.db.delete(team)
        await self.db.flush()

    async def update(self) -> None:
        await self.db.flush()
