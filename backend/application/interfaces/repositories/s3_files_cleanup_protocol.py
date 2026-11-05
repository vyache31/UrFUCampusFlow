from datetime import datetime
from typing import Protocol
from infrastructure.db.models import S3FilesCleanUp


class S3FilesCleanupRepositoryProtocol(Protocol):

    async def create(self, cleanup: S3FilesCleanUp) -> S3FilesCleanUp:
        ...

    async def get_ready_batch(self, now: datetime, limit: int = 5) -> list[S3FilesCleanUp]:
        ...

    async def update(self, cleanup: S3FilesCleanUp) -> S3FilesCleanUp:
        ...

    async def delete(self, cleanup: S3FilesCleanUp) -> None:
        ...
