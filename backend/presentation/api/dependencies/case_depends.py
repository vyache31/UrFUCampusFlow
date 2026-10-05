from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.database import get_db
from infrastructure.db.repositories.case_repository import CaseRepository
from infrastructure.db.repositories.user_repository import UserRepository
from infrastructure.db.repositories.university_info_repository import UniversityInfoRepository
from infrastructure.db.repositories.difficulty_level_repository import DifficultyLevelRepository
from infrastructure.db.repositories.evaluation_repository import EvaluationRepository
from infrastructure.db.repositories.case_status_repository import CaseStatusRepository
from infrastructure.db.repositories.semesters_repository import SemestersRepository
from application.services.semesters_service import SemestersService
from application.services.case_service import CaseService
from application.services.evaluation_service import EvaluationService
from infrastructure.db.repositories.case_semesters_repository import CaseSemestersRepository


def get_case_service(db: AsyncSession = Depends(get_db)):
    case_repo = CaseRepository(db)
    user_repo = UserRepository(db)
    uni_repo = UniversityInfoRepository(db)
    diff_repo = DifficultyLevelRepository(db)
    statuses_repo = CaseStatusRepository(db)
    semesters_repo = SemestersRepository(db)
    semesters_service = SemestersService(semesters_repo)
    case_semesters_repo = CaseSemestersRepository(db)
    evaluation_repo = EvaluationRepository(db)
    evaluation_service = EvaluationService(evaluation_repo, case_repo)

    return CaseService(
        case_repo,
        user_repo,
        uni_repo,
        diff_repo,
        statuses_repo,
        semesters_service,
        case_semesters_repo,
        evaluation_service,
    )
