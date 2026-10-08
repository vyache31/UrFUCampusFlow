from fastapi import Depends

from application.services.curator_meetings_attendance_service import CuratorMeetingAttendanceService
from application.services.meetings_service import MeetingsService
from application.services.microsoft_oauth_service import MicrosoftOAuthService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.curator_meeting_attendance_uow import SqlAlchemyCuratorMeetingAttendanceUoW
from infrastructure.db.uow.meetings_uow import SqlAlchemyMeetingsUoW
from infrastructure.integrations.microsoft_graph_client import GraphClient
from presentation.api.dependencies.http_client_dependency import get_microsoft_graph_client
from presentation.api.dependencies.oauth_depends import get_oauth_service


def get_curator_meetings_attendance_service() -> CuratorMeetingAttendanceService:
    return CuratorMeetingAttendanceService(
        SqlAlchemyCuratorMeetingAttendanceUoW(SessionLocal)
    )


def get_meetings_service(
    oauth_service: MicrosoftOAuthService = Depends(get_oauth_service),
    graph_client: GraphClient = Depends(get_microsoft_graph_client),
) -> MeetingsService:
    return MeetingsService(
        uow=SqlAlchemyMeetingsUoW(SessionLocal),
        oauth_service=oauth_service,
        graph_client=graph_client,
    )
