from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from aiobotocore.session import get_session

from config import settings

if TYPE_CHECKING:
    from types_aiobotocore_s3 import S3Client as SDKClient


class S3Client:

    def __init__(self) -> None:
        self.S3_ENDPOINT_URL = settings.S3_ENDPOINT_URL
        self.AWS_ACCESS_KEY_ID = settings.AWS_ACCESS_KEY_ID
        self.AWS_SECRET_ACCESS_KEY = settings.AWS_SECRET_ACCESS_KEY
        self.S3_BUCKET = settings.S3_BUCKET
        self.AWS_DEFAULT_REGION = settings.AWS_DEFAULT_REGION

    @asynccontextmanager
    async def get_client_session(self) -> AsyncIterator[SDKClient]:
        session = get_session()

        async with session.create_client(
            's3',
            endpoint_url=self.S3_ENDPOINT_URL,
            region_name=self.AWS_DEFAULT_REGION,
            aws_secret_access_key=self.AWS_SECRET_ACCESS_KEY,
            aws_access_key_id=self.AWS_ACCESS_KEY_ID
        ) as client:

            yield client

    async def upload(
        self,
        content: bytes,
        object_key: str,
        content_type: str
    ) -> None:
        async with self.get_client_session() as client:
            await client.put_object(
                Bucket=self.S3_BUCKET,
                Key=object_key,
                Body=content,
                ContentType=content_type
            )

    async def download(self, object_key: str) -> bytes:
        async with self.get_client_session() as client:
            response = await client.get_object(
                Bucket=self.S3_BUCKET,
                Key=object_key,
            )
            async with response["Body"] as stream:
                return await stream.read()

    async def delete(self, object_key: str) -> None:
        async with self.get_client_session() as client:
            await client.delete_object(
                Bucket=self.S3_BUCKET,
                Key=object_key,
            )
