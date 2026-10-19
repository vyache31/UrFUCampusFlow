from application.services.student_service import StudentService
from infrastructure.db.database import SessionLocal
from infrastructure.db.uow.student_uow import SqlAlchemyStudentUoW


def get_student_service() -> StudentService:
    return StudentService(SqlAlchemyStudentUoW(SessionLocal))
