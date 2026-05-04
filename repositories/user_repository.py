from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models.auth import Users, Roles


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str):
        user = await self.db.execute(
            select(Users)
            .where(Users.id == user_id)
            .options(
                selectinload(Users.role)
            )
        )

        return user.scalar_one_or_none()

    async def get_by_email(self, email: str):
        user = await self.db.execute(
            select(Users)
            .where(Users.email == email)
            .options(
                selectinload(Users.role)
            )
        )

        return user.scalar_one_or_none()

    async def get_all(self, limit: int = 10):  # ограничил на время, чтоб все записи не тянуть каждый раз
        users = await self.db.execute(
            select(Users)
            .options(
                selectinload(Users.role)
            )
            .limit(limit=limit))

        return users.scalars().all()

    async def get_role_by_id(self, role_id: int):
        result = await self.db.execute(select(Roles).where(Roles.id == role_id))
        return result.scalar_one_or_none()

    async def get_with_relations(self, user_id: str) -> Users:
        stmt = (
            select(Users)
            .where(Users.id == user_id)
            .options(
                selectinload(Users.role)
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def create(self, user: Users):
        self.db.add(user)
        await self.db.commit()
        # await self.db.refresh(user)

        return user

    async def delete(self, user: Users):
        await self.db.delete(user)
        await self.db.commit()

    async def update(self):
        await self.db.commit()

    async def get_hash_password(self, user_id: str) -> str:
        hash_password = await self.db.execute(select(Users.password_hash).where(Users.id == user_id))
        return hash_password.scalar_one_or_none()
