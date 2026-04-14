from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import CaseStatuses


class CaseStatusRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, limit: int = 10) -> list[CaseStatuses]:
        statuses = await self.db.execute(
            select(CaseStatuses)
            .limit(limit)
        )

        return statuses.scalars().all()

    async def get_by_id(self, status_id: int) -> CaseStatuses | None:
        status = await self.db.execute(
            select(CaseStatuses)
            .where(CaseStatuses.id == status_id)
        )

        return status.scalar_one_or_none()

    async def create(self, status: CaseStatuses) -> CaseStatuses:
        self.db.add(status)
        await self.db.commit()
        await self.db.refresh(status)

        return status

    async def update(self, status: CaseStatuses) -> CaseStatuses:
        await self.db.commit()
        await self.db.refresh(status)

        return status

    async def delete(self, status: CaseStatuses) -> None:
        await self.db.delete(status)
        await self.db.commit()

    async def delete_by_id(self, status_id: int) -> None:
        await self.db.execute(
            delete(CaseStatuses)
            .where(CaseStatuses.id == status_id)
        )

        await self.db.commit()
