from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.bot_uow import SqlAlchemyBotUoW
from application.services.bot_service import BotService


def get_bot_service() -> BotService:
    return BotService(SqlAlchemyBotUoW(SessionLocal))
