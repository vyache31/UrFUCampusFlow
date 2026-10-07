from application.services.curator_assignment_service import CuratorAssignmentService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.curator_assignment_uow import (
    SqlAlchemyCuratorAssignmentUoW,
)


def get_curator_assignment_service() -> CuratorAssignmentService:
    return CuratorAssignmentService(SqlAlchemyCuratorAssignmentUoW(SessionLocal))
