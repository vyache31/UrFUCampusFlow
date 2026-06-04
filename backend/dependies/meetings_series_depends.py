from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependies.http_client_dependency import get_microsoft_graph_client
from dependies.meetings_depends import get_meetings_repository
from dependies.oauth_depends import get_oauth_service
from dependies.team_case_history_depends import get_team_case_history_repo
from integrations.microsoft_graph_client import GraphClient
from repositories.meetings_repository import MeetingsRepository
from repositories.meetings_series_repository import MeetingsSeriesRepository
from repositories.team_case_history_repository import TeamCaseHistoryRepository
from services.meetings_series_service import MeetingsSeriesService
from services.microsoft_oauth_service import MicrosoftOAuthService


def get_meetings_series_repo(
    db: AsyncSession = Depends(get_db),
) -> MeetingsSeriesRepository:
    return MeetingsSeriesRepository(db)


def get_meetings_series_service(
    meetings_series_repository: MeetingsSeriesRepository = Depends(
        get_meetings_series_repo
    ),
    graph_client: GraphClient = Depends(get_microsoft_graph_client),
    meetings_repo: MeetingsRepository = Depends(get_meetings_repository),
    oauth_service: MicrosoftOAuthService = Depends(get_oauth_service),
    team_case_history_repo: TeamCaseHistoryRepository = Depends(
        get_team_case_history_repo
    ),
) -> MeetingsSeriesService:
    return MeetingsSeriesService(
        repo=meetings_series_repository,
        graph_client=graph_client,
        meetings_repo=meetings_repo,
        oauth_service=oauth_service,
        team_case_history_repo=team_case_history_repo,
    )
