from application.services.difficulty_level_service import DifficultyLevelService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.difficulty_level_uow import SqlAlchemyDifficultyLevelUoW


def get_difficulty_level_service() -> DifficultyLevelService:
    return DifficultyLevelService(SqlAlchemyDifficultyLevelUoW(SessionLocal))
