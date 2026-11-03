from application.services.s3_files_service import S3FileMetadataService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.meeting_tasks_uow import SqlAlchemyMeetingTasksUoW
from infrastructure.integrations.s3_client import S3Client


def get_s3_files_service() -> S3FileMetadataService:
    return S3FileMetadataService(
        uow=SqlAlchemyMeetingTasksUoW(SessionLocal),
        client=S3Client(),
    )
