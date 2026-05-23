from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models import Universities


class UniversityInfoRepository:

    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_all(self, limit: int = 10) -> list[Universities]:
        universities = await self.db.execute(
            select(Universities)
            .limit(limit)
        )

        return universities.scalars().all()

    async def get_by_id(self, uni_id: int) -> Universities | None:
        university = await self.db.execute(
            select(Universities)
            .where(Universities.id == uni_id)
        )

        return university.scalar_one_or_none()


    async def create(self, university: Universities) -> Universities:
        self.db.add(university)
        await self.db.commit()
        await self.db.refresh(university)

        return university


    async def update(self, university: Universities) -> Universities:
        await self.db.commit()
        await self.db.refresh(university)

        return university


    async def delete(self, university: Universities):
        await self.db.delete(university)

        await self.db.commit()


    async def delete_by_id(self, uni_id: int) -> None:
        await self.db.execute(
            delete(Universities)
            .where(Universities.id == uni_id)
        )

        await self.db.commit()
