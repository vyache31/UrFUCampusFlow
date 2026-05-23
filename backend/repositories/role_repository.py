from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Roles


class RoleRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 10) -> list[Roles]:
        roles = await self.db.execute(
            select(Roles)
            .limit(limit)
        )

        return roles.scalars().all()

    async def get_by_id(self, role_id: int) -> Roles | None:
        role = await self.db.execute(
            select(Roles)
            .where(Roles.id == role_id)
        )

        return role.scalar_one_or_none()

    async def create(self, role: Roles) -> Roles:
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)

        return role

    async def update(self, role: Roles) -> Roles:
        await self.db.commit()
        await self.db.refresh(role)

        return role

    async def delete(self, role: Roles) -> None:
        await self.db.delete(role)
        await self.db.commit()

    async def delete_by_id(self, role_id: int) -> None:
        await self.db.execute(
            delete(Roles)
            .where(Roles.id == role_id)
        )

        await self.db.commit()
