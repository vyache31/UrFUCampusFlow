from application.services.case_status_service import CaseStatusService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.case_status_uow import SqlAlchemyCaseStatusUoW


def get_case_status_service() -> CaseStatusService:
    return CaseStatusService(SqlAlchemyCaseStatusUoW(SessionLocal))
