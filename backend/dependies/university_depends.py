from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repositories.university_info_repository import UniversityInfoRepository
from services.university_info_service import UniversityInfoService


def get_university_service(db: AsyncSession = Depends(get_db)):
    rep = UniversityInfoRepository(db)

    return UniversityInfoService(rep)
