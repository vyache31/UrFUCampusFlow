from application.services.case_service import CaseService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.case_uow import SqlAlchemyCaseUoW


def get_case_service() -> CaseService:
    return CaseService(SqlAlchemyCaseUoW(SessionLocal))
