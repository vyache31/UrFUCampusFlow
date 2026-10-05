from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.database import get_db
from infrastructure.db.repositories.bot_repository import BotRepository
from application.services.bot_service import BotService


def get_bot_service(db: AsyncSession = Depends(get_db)):
    bot_repo = BotRepository(db)

    return BotService(bot_repo)
