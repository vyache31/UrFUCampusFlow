from dependies.oauth_depends import get_oauth_service
from dependies.http_client_dependency import get_microsoft_graph_client
from repositories.curator_assignments_repository import CuratorAssignmentsRepository
from repositories.curator_meetings_attendance_repository import (
    CuratorMeetingsAttendanceRepository,
)
from repositories.meetings_repository import MeetingsRepository
from services.curator_meetings_attendance_service import CuratorMeetingAttendanceService
from services.microsoft_oauth_service import MicrosoftOAuthService
from services.meetings_service import MeetingsService
from integrations.microsoft_graph_client import GraphClient
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends


def get_meetings_repository(db: AsyncSession = Depends(get_db)) -> MeetingsRepository:
    return MeetingsRepository(db)


def get_curator_meetings_attendance_service(
        db: AsyncSession = Depends(get_db),
        meetings_repo: MeetingsRepository = Depends(get_meetings_repository),
) -> CuratorMeetingAttendanceService:
    curator_attendance_repo = CuratorMeetingsAttendanceRepository(db)
    curator_assignments_repo = CuratorAssignmentsRepository(db)

    return CuratorMeetingAttendanceService(
        repo=curator_attendance_repo,
        curator_assignments_repo=curator_assignments_repo,
        meetings_repo=meetings_repo,
    )


def get_meetings_service(
        meetings_repo: MeetingsRepository = Depends(get_meetings_repository),
        oauth_service: MicrosoftOAuthService = Depends(get_oauth_service),
        graph_client: GraphClient = Depends(get_microsoft_graph_client),
        curator_attendance_service: CuratorMeetingAttendanceService = Depends(
            get_curator_meetings_attendance_service
        ),
) -> MeetingsService:
    return MeetingsService(
        meetings_repo=meetings_repo,
        oauth_service=oauth_service,
        graph_client=graph_client,
        curator_attendance_service=curator_attendance_service,
    )
