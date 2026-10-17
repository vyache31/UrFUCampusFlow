from application.services.iteration_service import IterationService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.iteration_uow import SqlAlchemyIterationUoW


def get_iteration_service() -> IterationService:
    return IterationService(SqlAlchemyIterationUoW(SessionLocal))
