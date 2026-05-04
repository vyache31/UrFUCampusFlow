from fastapi import APIRouter, Depends
from services.auth_service import AuthService
from schemas.user import (
    UserCreate, UserLoginRequest,
    UserTokenInfo
)
from dependies.auth_depends import get_auth_service

router = APIRouter(
    prefix="",
    tags=["Auth"]
)

@router.post('/register', response_model=UserTokenInfo)
async def register_user(
        schema: UserCreate,
        service: AuthService = Depends(get_auth_service)
) -> UserTokenInfo:
    return await service.register_user(schema)



@router.post('/login', response_model=UserTokenInfo)
async def login_user(
    schema: UserLoginRequest,
    service: AuthService = Depends(get_auth_service)
) -> UserTokenInfo:
    return await service.login_user(schema)