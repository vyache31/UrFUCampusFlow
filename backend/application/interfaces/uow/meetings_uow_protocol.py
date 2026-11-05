from typing import Protocol

from application.interfaces.repositories import (
    CuratorAssignmentsRepositoryProtocol,
    CuratorMeetingsAttendanceRepositoryProtocol,
    MeetingsRepositoryProtocol,
    S3FilesCleanupRepositoryProtocol,
    S3FilesRepositoryProtocol,
    TeamCaseHistoryRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class MeetingsUoWProtocol(UoWProtocol, Protocol):
    meetings_repository: MeetingsRepositoryProtocol
    team_case_history_repository: TeamCaseHistoryRepositoryProtocol
    curator_assignments_repository: CuratorAssignmentsRepositoryProtocol
    attendance_repository: CuratorMeetingsAttendanceRepositoryProtocol
    s3_files_repository: S3FilesRepositoryProtocol
    s3_files_cleanup_repository: S3FilesCleanupRepositoryProtocol
