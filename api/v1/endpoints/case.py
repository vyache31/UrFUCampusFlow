from fastapi import APIRouter, Depends, HTTPException, Query
from services.case_service import CaseService
from schemas.case import CaseResponse, CaseCreate, CaseUpdate
from dependies.case_depends import get_case_service


router = APIRouter(
    prefix='/cases',
    tags=["Cases"]
)


@router.get('/', response_model=list[CaseResponse])
async def get_all_cases(
        service: CaseService = Depends(get_case_service),
        limit: int = Query(10)
):
    return await service.get_all_cases(limit=limit)


@router.post('/', response_model=CaseResponse)
async def create_case(
        schema: CaseCreate,
        service: CaseService = Depends(get_case_service)
):
    try:
        return await service.create_case(schema)

    except ValueError as error:
        detail = str(error)
        status_code = 409 if detail == 'Case with this title already exists' else 404
        raise HTTPException(status_code=status_code, detail=detail)


@router.get('/{case_id}', response_model=CaseResponse)
async def get_case(
        case_id: str,
        service: CaseService = Depends(get_case_service)
):
    case = await service.get_case_by_id(case_id=case_id)

    if not case:
        raise HTTPException(status_code=404, detail=f'Case with id = {case_id} not found')

    return case


@router.patch('/{case_id}', response_model=CaseResponse)
async def update_case(
        case_id: str,
        schema: CaseUpdate,
        service: CaseService = Depends(get_case_service)
):
    try:
        case = await service.update_case(case_id=case_id, schema=schema)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    if not case:
        raise HTTPException(status_code=404, detail=f'Case with id = {case_id} not found')

    return case


@router.delete('/{case_id}')
async def delete_case(
        case_id: str,
        service: CaseService = Depends(get_case_service)
):
    result = await service.delete_case(case_id=case_id)
    if not result:
        raise HTTPException(status_code=404, detail=f'Case with id = {case_id} not found')

    return {'status': 'deleted'}