from fastapi import Depends

from application.services.semesters_service import SemestersService
from infrastructure.db.database import SessionLocal
from infrastructure.db.models import Semesters
from infrastructure.db.uow.semesters_uow import SqlAlchemySemestersUoW


def get_semesters_service() -> SemestersService:
    return SemestersService(SqlAlchemySemestersUoW(SessionLocal))


async def get_current_semester(
    service: SemestersService = Depends(get_semesters_service),
) -> Semesters:
    return await service.get_or_create_current()
