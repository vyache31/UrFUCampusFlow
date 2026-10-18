from application.services.team_service import TeamService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.team_uow import SqlAlchemyTeamUoW


def get_team_service() -> TeamService:
    return TeamService(SqlAlchemyTeamUoW(SessionLocal))
