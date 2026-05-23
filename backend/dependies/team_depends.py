from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.team_repository import TeamRepository
from services.team_service import TeamService


def get_team_service(db: AsyncSession = Depends(get_db)):
    rep = TeamRepository(db)

    return TeamService(rep)