from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repositories.team_case_history_repository import TeamCaseHistoryRepository
from services.team_case_history_service import TeamCaseHistoryService


def get_team_case_history_service(
        db: AsyncSession = Depends(get_db)
) -> TeamCaseHistoryService:
    team_case_history_repo = TeamCaseHistoryRepository(db)

    return TeamCaseHistoryService(team_case_history_repo)
