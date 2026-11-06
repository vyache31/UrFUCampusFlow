from fastapi import Depends

from application.services.microsoft_oauth_service import MicrosoftOAuthService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.bot_uow import SqlAlchemyBotUoW
from infrastructure.integrations.microsoft_graph_client import GraphClient
from application.services.bot_service import BotService
from presentation.api.dependencies.http_client_dependency import get_microsoft_graph_client
from presentation.api.dependencies.oauth_depends import get_oauth_service


def get_bot_service(
    oauth_service: MicrosoftOAuthService = Depends(get_oauth_service),
    graph_client: GraphClient = Depends(get_microsoft_graph_client),
) -> BotService:
    return BotService(
        uow=SqlAlchemyBotUoW(SessionLocal),
        oauth_service=oauth_service,
        graph_client=graph_client,
    )
