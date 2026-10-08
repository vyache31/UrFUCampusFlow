import httpx
from fastapi import Depends
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.microsoft_oauth_uow import SqlAlchemyMicrosoftOAuthUoW
from application.services.microsoft_oauth_service import MicrosoftOAuthService
from infrastructure.integrations.microsoft_oauth_client import OAuthClient
from presentation.api.dependencies.http_client_dependency import (
    get_graph_client,
    get_microsoft_graph_client,
)
from infrastructure.integrations.microsoft_graph_client import GraphClient
from presentation.api.dependencies.outlook_redis_depends import get_redis_session
import redis.asyncio as aioredis


def get_oauth_service(
        client: httpx.AsyncClient = Depends(get_graph_client),
        graph_client: GraphClient = Depends(get_microsoft_graph_client),
        redis_session: aioredis.Redis = Depends(get_redis_session)
) -> MicrosoftOAuthService:
    return MicrosoftOAuthService(
        uow=SqlAlchemyMicrosoftOAuthUoW(SessionLocal),
        oauth_client=OAuthClient(session=client),
        graph_client=graph_client,
        redis_session=redis_session
    )
