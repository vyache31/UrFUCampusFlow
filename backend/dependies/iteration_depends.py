from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repositories.iteration_repository import IterationRepository
from services.iteration_service import IterationService


def get_iteration_service(db: AsyncSession = Depends(get_db)):
    rep = IterationRepository(db)

    return IterationService(rep)
