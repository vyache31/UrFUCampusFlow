from typing import Protocol
from datetime import datetime

from infrastructure.db.models import S3FilesMetadata


class S3FilesRepositoryProtocol(Protocol):

    async def get_by_id(self, id: str) -> S3FilesMetadata | None:
        ...

    async def get_by_task_id(self, task_id: str, *, for_update: bool = False) -> list[S3FilesMetadata]:
        ...

    async def create(self, file_metadata: S3FilesMetadata) -> S3FilesMetadata:
       ...

    async def delete(self, file_metadata: S3FilesMetadata) -> None:
       ...

    async def get_by_id_to_update(self, id: str) -> S3FilesMetadata | None:
        ...

    async def get_uploading_files_meta(
        self,
        older_than: datetime,
        limit: int | None = 10,
    ) -> list[S3FilesMetadata]:
        ...
