from fastapi import Depends

from application.interfaces.uow.semesters_uow_protocol import SemestersUoWProtocol
from application.services.semesters_service import SemestersService
from infrastructure.db.database import SessionLocal
from infrastructure.db.models import Semesters
from infrastructure.db.uow.semesters_uow import SqlAlchemySemestersUoW


def get_semesters_uow() -> SemestersUoWProtocol:
    return SqlAlchemySemestersUoW(SessionLocal)


async def get_current_semester(
    uow: SemestersUoWProtocol = Depends(get_semesters_uow),
) -> Semesters:
    async with uow:
        service = SemestersService(uow.semesters_repository)
        semester = await service.get_or_create_current()
        await uow.commit()
        return semester
