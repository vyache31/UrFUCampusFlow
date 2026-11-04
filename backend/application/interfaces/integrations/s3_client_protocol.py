from typing import Protocol


class S3ClientProtocol(Protocol):

    async def upload(
        self,
        content: bytes,
        object_key: str,
        content_type: str
    ) -> None:
        ...

    async def download(
        self,
        object_key: str
    ) -> bytes:
        ...

    async def delete(
        self,
        object_key: str
    ) -> None:
        ...
