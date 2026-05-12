from fastapi import APIRouter, Depends, HTTPException, Query
from services.team_service import TeamService
from schemas.team import TeamCreate, TeamUpdate, TeamResponse
from dependies.team_depends import get_team_service
from dependies.auth_depends import get_current_auth_user, require_admin_role
from typing import List

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

@router.post('/', response_model=TeamResponse)
async def create_team(
        schema: TeamCreate,
        user=Depends(get_current_auth_user),
        service: TeamService = Depends(get_team_service)
):
    try:
        return await service.create_team(schema)
    except ValueError as err:
        detail = str(err)
        raise HTTPException(status_code=404, detail=detail)


@router.get('/', response_model=List[TeamResponse])
async def get_all_teams(
        limit: int = Query(10),
        user=Depends(get_current_auth_user),
        service: TeamService = Depends(get_team_service)
):
    return await service.get_all_teams(limit)


@router.get('/{team_id}', response_model=TeamResponse)
async def get_team(
        team_id: str,
        user=Depends(get_current_auth_user),
        service: TeamService = Depends(get_team_service)
):
    team = await service.get_team(team_id)

    if not team:
        raise HTTPException(status_code=404, detail='Team not found')

    return team


@router.patch('/{team_id}', response_model=TeamResponse)
async def update_team(
        team_id: str,
        schema: TeamUpdate,
        user=Depends(get_current_auth_user),
        service: TeamService = Depends(get_team_service)
):
    try:
        team = await service.update_team(team_id, schema)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))
    if not team:
        raise HTTPException(status_code=409, detail='Team not found')

    return team


@router.delete('/{team_id}')
async def delete_team(
        team_id: str,
        user=Depends(get_current_auth_user),
        service: TeamService = Depends(get_team_service)
):
    result = await service.delete_team(team_id)
    if not result:
        raise HTTPException(status_code=409, detail='Team not found')

    return {'status': 'deleted'}
