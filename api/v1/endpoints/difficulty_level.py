from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from dependies.difficulty_level_depends import get_difficulty_level_service
from dependies.auth_depends import get_current_auth_user, require_admin_role
from schemas.difficulty_level import DifficultyLevelResponse
from services.difficulty_level_service import DifficultyLevelService

router = APIRouter(
    prefix="/case-difficulty-levels",
    tags=["Case Difficulty Levels"]
)


@router.get('/', response_model=List[DifficultyLevelResponse])
async def get_all_difficulty_levels(
        limit: int = Query(10),
        user=Depends(get_current_auth_user),
        service: DifficultyLevelService = Depends(get_difficulty_level_service)
):
    return await service.get_all_difficulty_levels(limit)


@router.get('/{level_id}', response_model=DifficultyLevelResponse)
async def get_difficulty_level(
        level_id: int,
        user=Depends(get_current_auth_user),
        service: DifficultyLevelService = Depends(get_difficulty_level_service)
):
    level = await service.get_difficulty_level_by_id(level_id)

    if not level:
        raise HTTPException(status_code=404, detail='Difficulty level not found')

    return level
