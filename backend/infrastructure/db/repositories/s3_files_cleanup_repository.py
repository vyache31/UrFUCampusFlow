from infrastructure.db.models import S3FilesCleanUp
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from sqlalchemy import select

class S3FilesCleanUpRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, cleanup: S3FilesCleanUp) -> S3FilesCleanUp:
        self.db.add(cleanup)

        await self.db.flush()
        await self.db.refresh(cleanup)

        return cleanup


    async def get_ready_batch(self, now: datetime, limit: int = 5) -> list[S3FilesCleanUp]:
        batch = await self.db.execute(
            select(S3FilesCleanUp)
            .where(S3FilesCleanUp.next_attempt_at <= now)
            .order_by(
                S3FilesCleanUp.next_attempt_at,
                S3FilesCleanUp.created_at,
                S3FilesCleanUp.id,
            )
            .limit(limit)
            .with_for_update(skip_locked=True)
        )

        return list(batch.scalars().all())

    async def update(self, cleanup: S3FilesCleanUp) -> S3FilesCleanUp:
        await self.db.flush()
        return cleanup

    async def delete(self, cleanup: S3FilesCleanUp) -> None:
        await self.db.delete(cleanup)
