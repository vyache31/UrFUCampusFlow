from fastapi import APIRouter, Depends, HTTPException
from services.auth_service import AuthService
from schemas.user import (
    UserCreate, UserLoginRequest,
    UserTokenInfo
)
from dependies.auth_depends import (
    get_auth_service,
    get_current_auth_user_for_refresh,
)

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


@router.post('/auth/service/login')
async def login_service(
    payload: dict,
    service: AuthService = Depends(get_auth_service)
):
    try:
        return await service.login_service(payload)
    except ValueError as err:
        raise HTTPException(
            status_code=401,
            detail="Invalid service secret"
        )

@router.post(
    '/refresh',
    response_model=UserTokenInfo,
    response_model_exclude_none=True,
)
async def auth_refresh_jwt(
    user: UserLoginRequest = Depends(get_current_auth_user_for_refresh),
    service: AuthService = Depends(get_auth_service),
) -> UserTokenInfo:
    return await service.refresh_user(user)