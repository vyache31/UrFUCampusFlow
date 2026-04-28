from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.case_repository import CaseRepository
from repositories.user_repository import UserRepository
from repositories.university_info_repository import UniversityInfoRepository
from repositories.difficulty_level_repository import DifficultyLevelRepository
from repositories.case_status_repository import CaseStatusRepository
from services.case_service import CaseService


def get_case_service(db: AsyncSession = Depends(get_db)):
    case_repo = CaseRepository(db)
    user_repo = UserRepository(db)
    uni_repo = UniversityInfoRepository(db)
    diff_repo = DifficultyLevelRepository(db)
    statuses_repo = CaseStatusRepository(db)

    return CaseService(case_repo, user_repo, uni_repo, diff_repo, statuses_repo)
