from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.models import S3FilesMetadata


class S3FilesRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_uploading_files_meta(
        self,
        older_than: datetime,
        limit: int | None = 10,
    ) -> list[S3FilesMetadata]:
        stmt = (
            select(S3FilesMetadata)
            .where(
                S3FilesMetadata.status == "uploading",
                S3FilesMetadata.created_at <= older_than,
            )
            .order_by(S3FilesMetadata.created_at.asc())
            .with_for_update(skip_locked=True)
        )

        if limit is not None:
            stmt = stmt.limit(limit)

        results = await self.db.execute(stmt)
        return list(results.scalars().all())

    async def get_by_id(self, id: str) -> S3FilesMetadata | None:
        result = await self.db.execute(
            select(S3FilesMetadata).where(S3FilesMetadata.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_task_id(self, task_id: str, *, for_update: bool = False) -> list[S3FilesMetadata]:
        stmt = (
            select(S3FilesMetadata)
            .where(S3FilesMetadata.task_id == task_id)
            .order_by(S3FilesMetadata.id)
        )
        if for_update:
            stmt = stmt.with_for_update().execution_options(populate_existing=True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, file_metadata: S3FilesMetadata) -> S3FilesMetadata:
        self.db.add(file_metadata)
        await self.db.flush()
        return file_metadata

    async def delete(self, file_metadata: S3FilesMetadata) -> None:
        await self.db.delete(file_metadata)

    async def get_by_id_to_update(self, id: str) -> S3FilesMetadata | None:
        result = await self.db.execute(
            select(S3FilesMetadata)
            .where(S3FilesMetadata.id == id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        return result.scalar_one_or_none()
