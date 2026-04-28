from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from services.auth_service import AuthService
from dependies.user_depends import get_user_service
from services.user_service import UserService


def get_auth_service(user_service: UserService = Depends(get_user_service)):
    return AuthService(user_service)