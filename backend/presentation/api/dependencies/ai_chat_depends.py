import httpx
from fastapi import Depends

from application.services.ai_chat_service import AIChatService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.ai_chat_uow import SqlAlchemyAIChatUoW
from infrastructure.integrations.ai.ai_chat_client import AIClient
from presentation.api.dependencies.http_client_dependency import get_http_session


def get_ai_chat_service(
    session: httpx.AsyncClient = Depends(get_http_session),
) -> AIChatService:
    return AIChatService(SqlAlchemyAIChatUoW(SessionLocal), AIClient(session))
