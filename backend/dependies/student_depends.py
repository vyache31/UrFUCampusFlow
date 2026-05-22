from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.student_repository import StudentRepository
from services.student_service import StudentService


def get_student_service(db: AsyncSession = Depends(get_db)):
    rep = StudentRepository(db)

    return StudentService(rep)
