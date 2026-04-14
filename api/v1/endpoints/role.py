from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from dependies.role_depends import get_role_service
from schemas.role import RoleResponse
from services.role_service import RoleService

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)


@router.get('/', response_model=List[RoleResponse])
async def get_all_roles(
        limit: int = Query(10),
        service: RoleService = Depends(get_role_service)
):
    return await service.get_all_roles(limit)


@router.get('/{role_id}', response_model=RoleResponse)
async def get_role(
        role_id: int,
        service: RoleService = Depends(get_role_service)
):
    role = await service.get_role_by_id(role_id)

    if not role:
        raise HTTPException(status_code=404, detail='Role not found')

    return role
