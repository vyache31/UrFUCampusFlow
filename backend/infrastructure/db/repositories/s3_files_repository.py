from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.models import S3FilesMetadata


class S3FilesRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, id: str) -> S3FilesMetadata | None:
        result = await self.db.execute(
            select(S3FilesMetadata).where(S3FilesMetadata.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_task_id(self, task_id: str) -> list[S3FilesMetadata]:
        result = await self.db.execute(
            select(S3FilesMetadata).where(S3FilesMetadata.task_id == task_id)
        )
        return list(result.scalars().all())

    async def create(self, file_metadata: S3FilesMetadata) -> S3FilesMetadata:
        self.db.add(file_metadata)
        await self.db.flush()
        return file_metadata

    async def delete(self, file_metadata: S3FilesMetadata) -> None:
        await self.db.delete(file_metadata)
