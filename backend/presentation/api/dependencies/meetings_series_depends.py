from fastapi import Depends

from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.meetings_series_uow import SqlAlchemyMeetingsSeriesUoW
from presentation.api.dependencies.http_client_dependency import get_microsoft_graph_client
from presentation.api.dependencies.oauth_depends import get_oauth_service
from infrastructure.integrations.microsoft_graph_client import GraphClient
from application.services.meetings_series_service import MeetingsSeriesService
from application.services.microsoft_oauth_service import MicrosoftOAuthService


def get_meetings_series_service(
    graph_client: GraphClient = Depends(get_microsoft_graph_client),
    oauth_service: MicrosoftOAuthService = Depends(get_oauth_service),
) -> MeetingsSeriesService:
    return MeetingsSeriesService(
        uow=SqlAlchemyMeetingsSeriesUoW(SessionLocal),
        graph_client=graph_client,
        oauth_service=oauth_service,
    )
