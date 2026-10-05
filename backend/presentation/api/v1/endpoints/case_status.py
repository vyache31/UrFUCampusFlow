from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from presentation.api.dependencies.case_status_depends import get_case_status_service
from presentation.api.dependencies.auth_depends import get_current_auth_user
from presentation.api.schemas.case_status import CaseStatusResponse
from application.services.case_status_service import CaseStatusService

router = APIRouter(
    prefix="/case-statuses",
    tags=["Case Statuses"]
)


@router.get('/', response_model=List[CaseStatusResponse])
async def get_all_case_statuses(
        limit: int = Query(10),
        user=Depends(get_current_auth_user),
        service: CaseStatusService = Depends(get_case_status_service)
):
    return await service.get_all_case_statuses(limit)


@router.get('/{status_id}', response_model=CaseStatusResponse)
async def get_case_status(
        status_id: int,
        user=Depends(get_current_auth_user),
        service: CaseStatusService = Depends(get_case_status_service)
):
    status = await service.get_case_status_by_id(status_id)

    if not status:
        raise HTTPException(status_code=404, detail='Case status not found')

    return status
