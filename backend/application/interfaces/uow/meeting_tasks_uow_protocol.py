from typing import Protocol

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    MeetingTaskRepositoryProtocol,
    MeetingsRepositoryProtocol,
    S3FilesRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class MeetingTasksUoWProtocol(UoWProtocol, Protocol):
    meeting_tasks_repository: MeetingTaskRepositoryProtocol
    meetings_repository: MeetingsRepositoryProtocol
    s3_files_repository: S3FilesRepositoryProtocol
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol
