from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from repositories.role_repository import RoleRepository
from services.role_service import RoleService


def get_role_service(db: AsyncSession = Depends(get_db)):
    rep = RoleRepository(db)

    return RoleService(rep)
