from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from infrastructure.db.database import get_db
from infrastructure.db.repositories.user_repository import UserRepository
from application.services.user_service import UserService


def get_user_service(db: AsyncSession = Depends(get_db)):
    rep = UserRepository(db)

    return UserService(rep)


