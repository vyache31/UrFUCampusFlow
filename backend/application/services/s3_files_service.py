from infrastructure.db.models import S3FilesMetadata

from presentation.api.schemas.s3_files_schemas import S3FileMetadataResponse

from infrastructure.db.uow.meeting_tasks_uow import SqlAlchemyMeetingTasksUoW


class S3FileMetadataService:




    async def _to_response(self, file_metadata: S3FilesMetadata) -> S3FileMetadataResponse:
        return S3FileMetadataResponse(
            id=file_metadata.id,
            task_id=file_metadata.task_id,
            original_filename=file_metadata.original_filename,
            size_bytes=file_metadata.size_bytes,
            content_type=file_metadata.content_type,
            created_at=file_metadata.created_at,
            uploaded_by=file_metadata.uploaded_by
        )
