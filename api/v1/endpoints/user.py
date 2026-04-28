from fastapi import APIRouter, Depends, HTTPException, Query, Form, status
from services.user_service import UserService
from services.auth_service import AuthService
from schemas.user import (
    UserCreate, UserResponse,
    UserUpdate, UserLoginRequest,
    UserTokenInfo
)
from dependies.user_depends import get_user_service
from dependies.auth_depends import get_auth_service
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post('/', response_model=UserResponse)
async def create_user(
        schema: UserCreate,
        service: UserService = Depends(get_user_service)
):
    # TODO: Переписать валидацию в user_service
    try:
        return await service.create_user(schema)
    except ValueError as err:
        detail = str(err)
        status_code = 409 if detail == 'User already exist' else 404
        raise HTTPException(status_code=status_code, detail=detail)


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


@router.get('/', response_model=List[UserResponse])
async def get_all_users(
        limit: int = Query(10),
        service: UserService = Depends(get_user_service)
):
    return await service.get_all_users(limit)


@router.get('/{user_id}', response_model=UserResponse)
async def get_user(
        user_id: str,
        service: UserService = Depends(get_user_service)
):
    user = await service.get_user(user_id)

    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user

@router.patch('/{user_id}', response_model=UserResponse)
async def update_user(
        user_id: str,
        schema: UserUpdate,
        service: UserService = Depends(get_user_service)
):
    try:
        user = await service.update_user(user_id, schema)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user


@router.delete('/{user_id}')
async def delete_user(
        user_id: str,
        service: UserService = Depends(get_user_service)
):
    result = await service.delete_user(user_id)
    if not result:
        raise HTTPException(status_code=404, detail='User not found')

    return {'status': 'deleted'}
