from fastapi import APIRouter, Depends, HTTPException, Query
from services.user_service import UserService
from schemas.user import UserCreate, UserResponse, UserUpdate
from dependies.user_depends import get_user_service
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post('/', response_model=UserCreate)
async def create_user(
        schema: UserCreate,
        service: UserService = Depends(get_user_service())
):
    try:
        return await service.create_user(schema)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

@router.get('/', response_model=List[UserResponse])
async def get_all_users(
        limit: int = Query(),
        service: UserService = Depends(get_user_service())
):
    return await service.get_all_users(limit)


@router.get('/{user_id}', response_model=UserResponse)
async def get_user(
        user_id: str,
        service: UserService = Depends(get_user_service())
):
    user = await service.get_user(user_id)

    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user

@router.patch('/{user_id}', response_model=UserUpdate)
async def update_user(
        user_id: str,
        schema: UserUpdate,
        service: UserService = Depends(get_user_service())
):
    user = await service.update_user(user_id, schema)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user


@router.delete('/{user_id}')
async def delete_user(
        user_id: str,
        service: UserService = Depends(get_user_service())
):
    result = await service.delete_user(user_id)
    if not result:
        raise HTTPException(status_code=404, detail='User not found')

    return {'status': 'deleted'}
