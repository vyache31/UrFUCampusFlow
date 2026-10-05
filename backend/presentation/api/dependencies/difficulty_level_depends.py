from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import get_db
from infrastructure.db.repositories.difficulty_level_repository import DifficultyLevelRepository
from application.services.difficulty_level_service import DifficultyLevelService


def get_difficulty_level_service(db: AsyncSession = Depends(get_db)):
    rep = DifficultyLevelRepository(db)

    return DifficultyLevelService(rep)
