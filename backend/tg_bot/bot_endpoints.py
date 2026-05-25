from fastapi import APIRouter, Depends, HTTPException
from services.bot_service import BotService
from schemas.bot import (
    BotModeUpdate,
    BotCaseCreate,
    RecruitmentCuratorCreate,
    InterviewCreate
)
from dependies.bot_depends import get_bot_service
from dependies.auth_depends import get_current_auth_user
from models.bot import (
    BotCases,
    RecruitmentCurators,
    Interviews
)


router = APIRouter(
    prefix='/bot',
    tags=['Bot']
)


@router.get('/mode')
async def get_current_mode(
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    mode = await service.get_current_mode()
    if not mode:
        raise HTTPException(
            status_code=404,
            detail="Bot mode not found"
        )

    return mode


@router.patch('/mode')
async def change_current_mode(
    schema: BotModeUpdate,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    try:
        mode = await service.change_current_mode(
            mode=schema.mode
        )
        if not mode:
            raise HTTPException(
                status_code=404,
                detail="Bot mode not found"
            )
        return mode
    except ValueError as err:
        raise HTTPException(
            status_code=400,
            detail=str(err)
        )

@router.get('/cases')
async def get_all_bot_cases(
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    return await service.get_all_bot_cases()


@router.post('/cases')
async def add_bot_case(
    schema: BotCaseCreate,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    try:
        bot_case = BotCases(case_id=schema.case_id)
        return await service.add_bot_case(bot_case)
    except PermissionError as err:
        raise HTTPException(
            status_code=403,
            detail=str(err)
        )


@router.delete('/cases')
async def delete_bot_case(
    bot_case_id: str,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    try:
        bot_case = await service.get_bot_case_by_id(bot_case_id=bot_case_id)
        if not bot_case:
            raise HTTPException(
                status_code=404,
                detail='Case not found'
            )
        await service.delete_bot_case(bot_case)
        return {
            'status': 'deleted'
        }
    except PermissionError as err:
        raise HTTPException(
            status_code=403,
            detail=str(err)
        )


@router.get('/curators')
async def get_all_recruitment_curators(
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    return await service.get_all_recruitment_curators()


@router.post('/curators')
async def add_recruitment_curator(
    schema: RecruitmentCuratorCreate,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    try:
        curator = RecruitmentCurators(
            user_id=schema.curator_id
        )
        return await service.add_recruitment_curator(
            curator
        )
    except PermissionError as err:
        raise HTTPException(
            status_code=403,
            detail=str(err)
        )


@router.delete('/curators')
async def delete_recruitment_curator(
    curator_id: str,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    curator = await service.delete_recruitment_curator(curator_id=curator_id)
    if not curator:
        raise HTTPException(
            status_code=404,
            detail='Curator not found'
        )

    return {'status': 'deleted'}

@router.get('/interviews')
async def get_all_interviews(
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    return await service.get_all_interviews()


@router.post('/interviews')
async def add_interview(
    schema: InterviewCreate,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):

    interview = Interviews(
        tg_user_id=schema.tg_user_id,
        case_id=schema.case_id,
        date_time=schema.date_time
    )

    return await service.add_interview(interview)


@router.delete('/interviews')
async def delete_interview(
    interview_id: str,
    user=Depends(get_current_auth_user),
    service: BotService = Depends(get_bot_service)
):
    result = await service.delete_interview(interview_id=interview_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail='Interview not found'
        )

    return {
        'status': 'deleted'
    }