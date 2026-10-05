from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import get_db
from infrastructure.db.repositories.university_info_repository import UniversityInfoRepository
from application.services.university_info_service import UniversityInfoService


def get_university_service(db: AsyncSession = Depends(get_db)):
    rep = UniversityInfoRepository(db)

    return UniversityInfoService(rep)
