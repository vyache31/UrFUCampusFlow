from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from repositories.user_repository import UserRepository
from services.user_service import UserService


def get_user_service(db: AsyncSession = Depends(get_db)):
    rep = UserRepository(db)

    return UserService(rep)


