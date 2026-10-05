from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.db.database import get_db
from infrastructure.db.repositories.role_repository import RoleRepository
from application.services.role_service import RoleService


def get_role_service(db: AsyncSession = Depends(get_db)):
    rep = RoleRepository(db)

    return RoleService(rep)
