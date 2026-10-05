from infrastructure.db.database import get_db
from infrastructure.db.models import Semesters
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.repositories.semesters_repository import SemestersRepository
from application.services.semesters_service import SemestersService
from fastapi import Depends


def get_semester_service(
        db: AsyncSession = Depends(get_db)
) -> SemestersService:
    rep = SemestersRepository(db)

    return SemestersService(rep)


async def get_current_semester(
        service: SemestersService = Depends(get_semester_service)
) -> Semesters:
    return await service.get_or_create_current()
