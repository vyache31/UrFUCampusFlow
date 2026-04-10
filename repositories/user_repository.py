from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.auth import Users, Roles


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str):
        result = await self.db.execute(select(Users).where(Users.id == user_id))

        return result.scalar_one_or_none()

    async def get_by_email(self, email: str):
        result = await self.db.execute(select(Users).where(Users.email == email))

        return result.scalar_one_or_none()

    async def get_all(self, limit: int = 10): # ограничил на время, чтоб все записи не тянуть каждый раз
        result = await self.db.execute(select(Users).limit(limit))
        return result.scalars().all()

    async def get_role_by_id(self, role_id: int):
        result = await self.db.execute(select(Roles).where(Roles.id == role_id))
        return result.scalar_one_or_none()

    async def create(self, user: Users):
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def delete(self, user: Users):
        await self.db.delete(user)
        await self.db.commit()

    async def update(self):
        await self.db.commit()
