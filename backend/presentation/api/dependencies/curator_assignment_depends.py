from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import get_db
from infrastructure.db.repositories.curator_assignments_repository import CuratorAssignmentsRepository
from application.services.curator_assignment_service import CuratorAssignmentService


def get_curator_assignment_service(
        db: AsyncSession = Depends(get_db)
) -> CuratorAssignmentService:
    repo = CuratorAssignmentsRepository(db)

    return CuratorAssignmentService(repo)
