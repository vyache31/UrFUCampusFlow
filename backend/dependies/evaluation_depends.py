from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repositories.case_repository import CaseRepository
from repositories.evaluation_repository import EvaluationRepository
from services.evaluation_service import EvaluationService


def get_evaluation_service(db: AsyncSession = Depends(get_db)) -> EvaluationService:
    evaluation_repo = EvaluationRepository(db)
    case_repo = CaseRepository(db)

    return EvaluationService(evaluation_repo, case_repo)
