import httpx
from fastapi import Depends
from database import get_db
from repositories.microsoft_oauth_repository import MicrosoftOAuthRepository
from services.microsoft_oauth_service import MicrosoftOAuthService
from integrations.microsoft_graph_client import GraphClient
from integrations.microsoft_oauth_client import OAuthClient
from sqlalchemy.ext.asyncio import AsyncSession
from dependies.http_client_dependency import get_graph_client


def get_oauth_service(
        db: AsyncSession = Depends(get_db),
        client: httpx.AsyncClient = Depends(get_graph_client)
):
    rep = MicrosoftOAuthRepository(db)

    return MicrosoftOAuthService(
        rep=rep,
        oauth_client=OAuthClient(session=client),
        graph_client=GraphClient(session=client)
    )