from application.services.ai_chat_service import AIChatService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.ai_chat_uow import SqlAlchemyAIChatUoW


def get_ai_chat_service() -> AIChatService:
    return AIChatService(SqlAlchemyAIChatUoW(SessionLocal))
