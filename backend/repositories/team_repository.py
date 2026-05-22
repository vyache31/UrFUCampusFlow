from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Teams, Universities


class TeamRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, team_id: str):
        result = await self.db.execute(select(Teams).where(Teams.id == team_id))

        return result.scalar_one_or_none()

    async def get_by_name(self, team_name: str):
        result = await self.db.execute(select(Teams).where(Teams.name == team_name))

        return result.scalar_one_or_none()

    async def verify_university(self, university_id: int) -> bool:
        result = await self.db.execute(
            select(Universities).where(Universities.id == university_id)
        )

        return result.scalar_one_or_none() is not None

    async def get_all(self, limit: int = 10): # ограничил на время, чтоб все записи не тянуть каждый раз
        result = await self.db.execute(select(Teams).limit(limit))
        return result.scalars().all()

    async def create(self, team: Teams):
        self.db.add(team)
        await self.db.commit()
        await self.db.refresh(team)

        return team

    async def delete(self, team: Teams):
        await self.db.delete(team)
        await self.db.commit()

    async def update(self):
        await self.db.commit()
