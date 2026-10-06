from application.services.team_members_service import TeamMembersService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.team_members_uow import SqlAlchemyTeamMembersUoW


def get_team_members_service() -> TeamMembersService:
    return TeamMembersService(SqlAlchemyTeamMembersUoW(SessionLocal))
