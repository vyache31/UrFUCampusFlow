from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from dependies.iteration_depends import get_iteration_service
from dependies.auth_depends import get_current_auth_user
from schemas.iteration import IterationResponse
from services.iteration_service import IterationService

router = APIRouter(
    prefix="/iterations",
    tags=["Iterations"]
)


@router.get('/', response_model=List[IterationResponse])
async def get_all_iterations(
        limit: int = Query(10),
        user=Depends(get_current_auth_user),
        service: IterationService = Depends(get_iteration_service)
):
    return await service.get_all_iterations(limit)


@router.get('/{iteration_id}', response_model=IterationResponse)
async def get_iteration(
        iteration_id: int,
        user=Depends(get_current_auth_user),
        service: IterationService = Depends(get_iteration_service)
):
    iteration = await service.get_iteration_by_id(iteration_id)

    if not iteration:
        raise HTTPException(status_code=404, detail='Iteration not found')

    return iteration
