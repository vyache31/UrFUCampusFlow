from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.database import get_db
from infrastructure.db.repositories.student_repository import StudentRepository
from application.services.student_service import StudentService


def get_student_service(db: AsyncSession = Depends(get_db)):
    rep = StudentRepository(db)

    return StudentService(rep)
