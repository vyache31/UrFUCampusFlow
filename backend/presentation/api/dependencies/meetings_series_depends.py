from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import get_db
from presentation.api.dependencies.http_client_dependency import get_microsoft_graph_client
from presentation.api.dependencies.meetings_depends import get_meetings_repository
from presentation.api.dependencies.oauth_depends import get_oauth_service
from presentation.api.dependencies.team_case_history_depends import get_team_case_history_repo
from infrastructure.integrations.microsoft_graph_client import GraphClient
from infrastructure.db.repositories.meetings_repository import MeetingsRepository
from infrastructure.db.repositories.meetings_series_repository import MeetingsSeriesRepository
from infrastructure.db.repositories.team_case_history_repository import TeamCaseHistoryRepository
from application.services.meetings_series_service import MeetingsSeriesService
from application.services.microsoft_oauth_service import MicrosoftOAuthService


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
