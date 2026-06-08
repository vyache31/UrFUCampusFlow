from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from tg_bot.bot_repository import BotRepository
from tg_bot.bot_service import BotService


def get_bot_service(db: AsyncSession = Depends(get_db)):
    bot_repo = BotRepository(db)

    return BotService(bot_repo)

