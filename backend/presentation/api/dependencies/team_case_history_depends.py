from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import SessionLocal, get_db
from infrastructure.db.models import TeamCaseHistory
from infrastructure.db.repositories.team_case_history_repository import TeamCaseHistoryRepository
from infrastructure.db.uow.team_case_history_uow import (
    SqlAlchemyTeamCaseHistoryUoW,
)
from application.services.team_case_history_service import TeamCaseHistoryService


def get_team_case_history_repo(
    db: AsyncSession = Depends(get_db),
) -> TeamCaseHistoryRepository:
    return TeamCaseHistoryRepository(db)


def get_team_case_history_service() -> TeamCaseHistoryService:
    return TeamCaseHistoryService(SqlAlchemyTeamCaseHistoryUoW(SessionLocal))


async def get_current_team_case_history_by_team_id(
    team_id: str,
    team_case_history_service: TeamCaseHistoryService = Depends(
        get_team_case_history_service
    ),
) -> TeamCaseHistory:
    team_case_history = await team_case_history_service.get_current_by_team_id(team_id)

    if not team_case_history:
        raise HTTPException(
            status_code=409, detail="This team has not active team case history entry"
        )

    return team_case_history
