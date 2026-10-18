from application.services.evaluation_service import EvaluationService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.evaluation_uow import SqlAlchemyEvaluationUoW


def get_evaluation_service() -> EvaluationService:
    return EvaluationService(SqlAlchemyEvaluationUoW(SessionLocal))
