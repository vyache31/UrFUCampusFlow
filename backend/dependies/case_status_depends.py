from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repositories.case_status_repository import CaseStatusRepository
from services.case_status_service import CaseStatusService


def get_case_status_service(db: AsyncSession = Depends(get_db)):
    rep = CaseStatusRepository(db)

    return CaseStatusService(rep)
