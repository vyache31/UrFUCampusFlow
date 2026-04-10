from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.case_repository import CaseRepository
from services.case_service import CaseService


def get_case_service(db: AsyncSession = Depends(get_db)):
    rep = CaseRepository(db)

    return CaseService(rep)
