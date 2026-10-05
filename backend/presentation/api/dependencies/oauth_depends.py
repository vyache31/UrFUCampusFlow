import httpx
from fastapi import Depends
from infrastructure.db.database import get_db
from infrastructure.db.repositories.microsoft_oauth_repository import MicrosoftOAuthRepository
from application.services.microsoft_oauth_service import MicrosoftOAuthService
from infrastructure.integrations.microsoft_graph_client import GraphClient
from infrastructure.integrations.microsoft_oauth_client import OAuthClient
from sqlalchemy.ext.asyncio import AsyncSession
from presentation.api.dependencies.http_client_dependency import get_graph_client
from presentation.api.dependencies.outlook_redis_depends import get_redis_session
import redis.asyncio as aioredis


def get_oauth_service(
        db: AsyncSession = Depends(get_db),
        client: httpx.AsyncClient = Depends(get_graph_client),
        redis_session: aioredis.Redis = Depends(get_redis_session)
):
    rep = MicrosoftOAuthRepository(db)

    return MicrosoftOAuthService(
        rep=rep,
        oauth_client=OAuthClient(session=client),
        graph_client=GraphClient(session=client),
        redis_session=redis_session
    )
