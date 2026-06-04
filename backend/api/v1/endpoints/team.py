import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from services.team_service import TeamService
from schemas.team import TeamCreate, TeamUpdate, TeamResponse
from dependies.team_case_history_depends import get_current_team_case_history_by_team_id
from schemas.outlook_meetings import (
    MeetingResponse,
    MeetingCreate,
    MeetingUpdate,
    MeetingTaskCreate,
    MeetingTaskUpdate,
    MeetingTaskResponse
)
from schemas.meetings_series_schemas import MeetingsSeriesCreate, MeetingsSeriesResponse
from services.meetings_service import MeetingsService
from services.meetings_series_service import MeetingsSeriesService
from dependies.meetings_depends import get_meetings_service
from dependies.meetings_series_depends import get_meetings_series_service
from services.meeting_tasks_service import MeetingTasksService
from dependies.meeting_task_depends import get_meeting_tasks_service
from schemas.team_case_history import TeamCaseHistoryCreate, TeamCaseHistoryResponse
from schemas.team_members import TeamMemberCreate, TeamMemberResponse
from dependies.team_depends import get_team_service
from dependies.team_case_history_depends import get_team_case_history_service
from dependies.team_members_depends import get_team_members_service
from dependies.auth_depends import get_current_auth_user
from services.team_case_history_service import TeamCaseHistoryService
from services.team_members_service import TeamMembersService
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


@router.get('/{team_id}/members', response_model=list[TeamMemberResponse])
async def get_team_members(
        team_id: str,
        current_only: bool = Query(True),
        user=Depends(get_current_auth_user),
        service: TeamMembersService = Depends(get_team_members_service)
):
    try:
        return await service.get_team_members_response(
            team_id=team_id,
            current_only=current_only
        )
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))


@router.post('/{team_id}/members', response_model=TeamMemberResponse)
async def add_team_member(
        team_id: str,
        schema: TeamMemberCreate,
        user=Depends(get_current_auth_user),
        service: TeamMembersService = Depends(get_team_members_service)
):
    try:
        team_member = await service.add_member(
            team_id=team_id,
            student_id=schema.student_id,
            position=schema.position,
            joined_at=schema.joined_at
        )

        return service.to_response(team_member)
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))


@router.post('/{team_id}/members/{team_member_id}/end', response_model=TeamMemberResponse)
async def end_team_member(
        team_id: str,
        team_member_id: str,
        user=Depends(get_current_auth_user),
        service: TeamMembersService = Depends(get_team_members_service)
):
    team_member = await service.get_member(team_member_id)

    if not team_member or team_member.team_id != team_id:
        raise HTTPException(status_code=404, detail='Team member not found')

    try:
        team_member = await service.end_membership(team_member_id=team_member_id)
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))

    return service.to_response(team_member)


@router.get('/{team_id}/history', response_model=list[TeamCaseHistoryResponse])
async def get_team_history(
        team_id: str,
        user=Depends(get_current_auth_user),
        service: TeamCaseHistoryService = Depends(get_team_case_history_service)
):
    try:
        return await service.get_team_history_response(team_id=team_id)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))


@router.post('/{team_id}/history', response_model=TeamCaseHistoryResponse)
async def assign_team_to_case_semester(
        team_id: str,
        schema: TeamCaseHistoryCreate,
        user=Depends(get_current_auth_user),
        service: TeamCaseHistoryService = Depends(get_team_case_history_service)
):
    try:
        team_case_history = await service.assign_team_to_case_semester(
            team_id=team_id,
            case_semesters_id=schema.case_semesters_id,
            started_at=schema.started_at,
            is_current=schema.is_current
        )

        return service.to_response(team_case_history)
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))


@router.post('/{team_id}/history/end-current', response_model=TeamCaseHistoryResponse)
async def end_current_team_case_history(
        team_id: str,
        user=Depends(get_current_auth_user),
        service: TeamCaseHistoryService = Depends(get_team_case_history_service)
):
    try:
        team_case_history = await service.end_current_for_team(team_id=team_id)
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))

    if not team_case_history:
        raise HTTPException(status_code=404, detail='Current team case history not found')

    return service.to_response(team_case_history)


@router.post('/{team_id}/meetings', response_model=MeetingResponse)
async def create_meeting_for_team(
        team_id: str,
        schema: MeetingCreate,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsService = Depends(get_meetings_service),
):
    try:
        meeting = await service.create_meeting(
            user_id=user.id,
            current_team_case_history_id=current_team_case_history.id,
            meeting_data=schema
        )

        return meeting
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))
    except httpx.HTTPStatusError as err:
        raise HTTPException(
            status_code=502,
            detail=f'Microsoft Graph error: {err.response.status_code} {err.response.text}'
        )


@router.get('/{team_id}/meetings', response_model=list[MeetingResponse])
async def get_team_meetings(
        team_id: str,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsService = Depends(get_meetings_service),
):
    return await service.get_by_team_case_history_id(
        team_case_history_id=current_team_case_history.id
    )


@router.patch('/{team_id}/meetings/{meeting_id}', response_model=MeetingResponse)
async def update_team_meeting(
        team_id: str,
        meeting_id: str,
        schema: MeetingUpdate,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsService = Depends(get_meetings_service),
):
    try:
        meeting = await service.update_meeting(
            user_id=user.id,
            current_team_case_history_id=current_team_case_history.id,
            meeting_id=meeting_id,
            meeting_data=schema
        )
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))
    except httpx.HTTPStatusError as err:
        raise HTTPException(
            status_code=502,
            detail=f'Microsoft Graph error: {err.response.status_code} {err.response.text}'
        )

    if not meeting:
        raise HTTPException(status_code=404, detail='Meeting not found')

    return meeting


@router.delete('/{team_id}/meetings/{meeting_id}')
async def delete_team_meeting(
        team_id: str,
        meeting_id: str,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsService = Depends(get_meetings_service),
):
    try:
        result = await service.delete_meeting(
            user_id=user.id,
            current_team_case_history_id=current_team_case_history.id,
            meeting_id=meeting_id
        )
    except httpx.HTTPStatusError as err:
        raise HTTPException(
            status_code=502,
            detail=f'Microsoft Graph error: {err.response.status_code} {err.response.text}'
        )

    if not result:
        raise HTTPException(status_code=404, detail='Meeting not found')

    return {'status': 'deleted'}


@router.post('/{team_id}/meetings-series', response_model=MeetingsSeriesResponse)
async def create_meetings_series_for_team(
        team_id: str,
        schema: MeetingsSeriesCreate,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsSeriesService = Depends(get_meetings_series_service),
):
    try:
        return await service.create_series(
            user_id=user.id,
            team_case_history_id=current_team_case_history.id,
            schema=schema
        )
    except ValueError as err:
        raise HTTPException(status_code=409, detail=str(err))
    except httpx.HTTPStatusError as err:
        raise HTTPException(
            status_code=502,
            detail=f'Microsoft Graph error: {err.response.status_code} {err.response.text}'
        )


@router.get('/{team_id}/meetings-series', response_model=list[MeetingsSeriesResponse])
async def get_team_meetings_series(
        team_id: str,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsSeriesService = Depends(get_meetings_series_service),
):
    return await service.get_by_team_case_history_id(
        team_case_history_id=current_team_case_history.id
    )


@router.delete('/{team_id}/meetings-series/{series_id}')
async def delete_team_meetings_series(
        team_id: str,
        series_id: str,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingsSeriesService = Depends(get_meetings_series_service),
):
    try:
        result = await service.delete_meetings_series(
            series_id=series_id,
            current_team_case_history_id=current_team_case_history.id,
            user_id=user.id
        )
    except httpx.HTTPStatusError as err:
        raise HTTPException(
            status_code=502,
            detail=f'Microsoft Graph error: {err.response.status_code} {err.response.text}'
        )

    if not result:
        raise HTTPException(status_code=404, detail='Meetings series not found')

    return {'status': 'deleted'}


@router.post('/{team_id}/meetings/{meeting_id}/tasks', response_model=MeetingTaskResponse)
async def create_meeting_task(
        team_id: str,
        meeting_id: str,
        schema: MeetingTaskCreate,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingTasksService = Depends(get_meeting_tasks_service),
):
    try:
        return await service.create_task(
            schema=schema,
            meeting_id=meeting_id,
            current_team_case_history_id=current_team_case_history.id
        )
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))


@router.get('/{team_id}/meetings/{meeting_id}/tasks', response_model=list[MeetingTaskResponse])
async def get_meeting_tasks(
        team_id: str,
        meeting_id: str,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingTasksService = Depends(get_meeting_tasks_service),
):
    try:
        return await service.get_all_meeting_tasks(
            meeting_id=meeting_id,
            current_team_case_history_id=current_team_case_history.id
        )
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))


@router.patch('/{team_id}/meetings/{meeting_id}/tasks/{task_id}', response_model=MeetingTaskResponse)
async def update_meeting_task(
        team_id: str,
        meeting_id: str,
        task_id: str,
        schema: MeetingTaskUpdate,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingTasksService = Depends(get_meeting_tasks_service),
):
    try:
        return await service.update_task(
            schema=schema,
            meeting_id=meeting_id,
            task_id=task_id,
            current_team_case_history_id=current_team_case_history.id
        )
    except ValueError as err:
        detail = str(err)
        status_code = 404 if 'does not exist' in detail else 409
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete('/{team_id}/meetings/{meeting_id}/tasks/{task_id}')
async def delete_meeting_task(
        team_id: str,
        meeting_id: str,
        task_id: str,
        user=Depends(get_current_auth_user),
        current_team_case_history=Depends(get_current_team_case_history_by_team_id),
        service: MeetingTasksService = Depends(get_meeting_tasks_service),
):
    try:
        await service.delete_task(
            meeting_id=meeting_id,
            task_id=task_id,
            current_team_case_history_id=current_team_case_history.id
        )
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

    return {'status': 'deleted'}
