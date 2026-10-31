from fastapi import UploadFile
from uuid import uuid4
from datetime import datetime, UTC

from infrastructure.db.models import MeetingTask, S3FilesMetadata, Users

from presentation.api.schemas.s3_files_schemas import S3FileMetadataResponse

from application.exceptions.base import (
    ApplicationValidationError,
    ForbiddenError,
    NotFoundError,
    RequiredFieldError,
)
from application.exceptions.meeting import MeetingNotFoundError, MeetingTaskNotFoundError
from application.interfaces.uow.meeting_tasks_uow_protocol import MeetingTasksUoWProtocol

from application.interfaces.integrations import S3ClientProtocol



class S3FileMetadataService:

    def __init__(
        self,
        uow: MeetingTasksUoWProtocol,
        client: S3ClientProtocol) -> None:

        self.uow = uow
        self.client = client

    @staticmethod
    async def _process_file(file: UploadFile) -> bytes:
        data: bytes = await file.read()

        return data

    async def _check_if_valid(
        self,
        task_id: str,
        user: Users,
        uow: MeetingTasksUoWProtocol,
        meeting_id: str,
        team_id: str,
    ) -> MeetingTask:
        if user.role is None or user.role.code not in {"CURATOR", "ADMIN"}:
            raise ForbiddenError("Only administrators and curators can access task files")

        task = await uow.meeting_tasks_repository.get_by_id(task_id)

        if task is None or task.meeting_id != meeting_id:
            raise MeetingTaskNotFoundError("This task does not exist in the given meeting")

        meeting = await uow.meetings_repository.get_by_id(meeting_id)
        if (
            meeting is None
            or meeting.team_case_history is None
            or meeting.team_case_history.team_id != team_id
        ):
            raise MeetingNotFoundError("This meeting does not exist in the given team")

        if user.role.code == "CURATOR":
            assignment = await uow.curator_assignments_repository.get_current_by_user_and_team(
                user_id=user.id, team_id=team_id
            )
            if assignment is None:
                raise ForbiddenError("You are not a current curator of this team")

        return task

    async def get_by_task_id(
        self,
        task_id: str,
        user: Users,
        meeting_id: str,
        team_id: str,
    ) -> list[S3FileMetadataResponse]:
        async with self.uow as uow:

            await self._check_if_valid(
                task_id=task_id,
                user=user,
                meeting_id=meeting_id,
                team_id=team_id,
                uow=uow
            )

            metadata = await uow.s3_files_repository.get_by_task_id(task_id)

            return [self._to_response(data) for data in metadata]

    async def upload(
        self,
        task_id: str,
        user: Users,
        meeting_id: str,
        team_id: str,
        file: UploadFile
    ) -> S3FileMetadataResponse:

        async with self.uow as uow:
            await self._check_if_valid(
                task_id=task_id,
                user=user,
                meeting_id=meeting_id,
                team_id=team_id,
                uow=uow
            )

            if not file.filename:
                raise RequiredFieldError('File must be named')

            FILE_SIZE_LIMIT = 20*1024*1024


            if file.size is None:
                raise ApplicationValidationError('File size is unknown')

            if file.size > FILE_SIZE_LIMIT:
                raise ApplicationValidationError('File size must not exceed 20 MiB')

            object_key = f'meetings/tasks/files/{str(uuid4())}'
            content_type = file.content_type or 'application/octet-stream'

            metadata = S3FilesMetadata(
                id = str(uuid4()),
                task_id = task_id,
                object_key = object_key,
                original_filename = file.filename,
                size_bytes = file.size,
                content_type = content_type,
                created_at = datetime.now(UTC),
                uploaded_by = user.id
            )

            await uow.s3_files_repository.create(metadata)

            await self.client.upload(
                content=await self._process_file(file),
                content_type=content_type,
                object_key=object_key
            )

            await uow.commit()
            return self._to_response(metadata)

    async def download(
        self,
        task_id: str,
        user: Users,
        meeting_id: str,
        team_id: str,
        file_id: str,
    ) -> tuple[bytes, S3FileMetadataResponse]:

        async with self.uow as uow:

            await self._check_if_valid(
                task_id=task_id,
                user=user,
                meeting_id=meeting_id,
                team_id=team_id,
                uow=uow,
            )

            metadata = await uow.s3_files_repository.get_by_id(file_id)

            if metadata is None or metadata.task_id != task_id:
                raise NotFoundError('This file does not exist in the given task')

            content = await self.client.download(
                object_key=metadata.object_key
            )

            return content, self._to_response(metadata)

    async def delete(
        self,
        task_id: str,
        user: Users,
        meeting_id: str,
        team_id: str,
        file_id: str,
    ) -> None:
        async with self.uow as uow:
            await self._check_if_valid(
                task_id=task_id,
                user=user,
                meeting_id=meeting_id,
                team_id=team_id,
                uow=uow,
            )

            metadata = await uow.s3_files_repository.get_by_id(file_id)
            if metadata is None or metadata.task_id != task_id:
                raise NotFoundError('This file does not exist in the given task')

            await self.client.delete(metadata.object_key)
            await uow.s3_files_repository.delete(metadata)
            await uow.commit()

    def _to_response(self, file_metadata: S3FilesMetadata) -> S3FileMetadataResponse:
        return S3FileMetadataResponse(
            id=file_metadata.id,
            task_id=file_metadata.task_id,
            original_filename=file_metadata.original_filename,
            size_bytes=file_metadata.size_bytes,
            content_type=file_metadata.content_type,
            created_at=file_metadata.created_at,
            uploaded_by=file_metadata.uploaded_by
        )
