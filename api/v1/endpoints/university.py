from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from dependies.university_depends import get_university_service
from schemas.university import UniversityCreate, UniversityResponse, UniversityUpdate
from services.university_info_service import UniversityInfoService

router = APIRouter(
    prefix="/universities",
    tags=["Universities"]
)


@router.post('/', response_model=UniversityResponse)
async def create_university(
        schema: UniversityCreate,
        service: UniversityInfoService = Depends(get_university_service)
):
    return await service.create_university(schema)


@router.get('/', response_model=List[UniversityResponse])
async def get_all_universities(
        limit: int = Query(10),
        service: UniversityInfoService = Depends(get_university_service)
):
    return await service.get_all_universities(limit)


@router.get('/{uni_id}', response_model=UniversityResponse)
async def get_university(
        uni_id: int,
        service: UniversityInfoService = Depends(get_university_service)
):
    university = await service.get_university_by_id(uni_id)

    if not university:
        raise HTTPException(status_code=404, detail='University not found')

    return university


@router.patch('/{uni_id}', response_model=UniversityResponse)
async def update_university(
        uni_id: int,
        schema: UniversityUpdate,
        service: UniversityInfoService = Depends(get_university_service)
):
    university = await service.update_university(uni_id, schema)

    if not university:
        raise HTTPException(status_code=404, detail='University not found')

    return university


@router.delete('/{uni_id}')
async def delete_university(
        uni_id: int,
        service: UniversityInfoService = Depends(get_university_service)
):
    result = await service.delete_university(uni_id)

    if not result:
        raise HTTPException(status_code=404, detail='University not found')

    return {'status': 'deleted'}
