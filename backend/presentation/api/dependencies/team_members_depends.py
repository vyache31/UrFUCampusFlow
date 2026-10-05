from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import get_db
from infrastructure.db.repositories.team_members_repository import TeamMembersRepository
from application.services.team_members_service import TeamMembersService


def get_team_members_service(
        db: AsyncSession = Depends(get_db)
) -> TeamMembersService:
    team_members_repo = TeamMembersRepository(db)

    return TeamMembersService(team_members_repo)
