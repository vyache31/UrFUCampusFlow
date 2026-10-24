from application.interfaces.uow.difficulty_level_uow_protocol import DifficultyLevelUoWProtocol
from infrastructure.db.models import DifficultyLevels
from presentation.api.schemas.difficulty_level import (
    DifficultyLevelCreate,
    DifficultyLevelResponse,
    DifficultyLevelUpdate,
)


class DifficultyLevelService:

    def __init__(self, uow: DifficultyLevelUoWProtocol):
        self.uow = uow

    async def create_difficulty_level(self, schema: DifficultyLevelCreate) -> DifficultyLevelResponse:
        level = DifficultyLevels(
            code=schema.code,
            level_name=schema.level_name
        )

        async with self.uow as uow:
            level = await uow.difficulty_level_repository.create(level)
            response = DifficultyLevelResponse.model_validate(level)
            await uow.commit()
            return response

    async def get_difficulty_level_by_id(self, level_id: int) -> DifficultyLevelResponse | None:
        async with self.uow as uow:
            level = await uow.difficulty_level_repository.get_by_id(level_id)
            return DifficultyLevelResponse.model_validate(level) if level else None

    async def get_all_difficulty_levels(self, limit: int = 10) -> list[DifficultyLevelResponse]:
        async with self.uow as uow:
            levels = await uow.difficulty_level_repository.get_all(limit=limit)
            return [DifficultyLevelResponse.model_validate(level) for level in levels]

    async def update_difficulty_level(self, level_id: int, schema: DifficultyLevelUpdate) -> DifficultyLevelResponse | None:
        async with self.uow as uow:
            level = await uow.difficulty_level_repository.get_by_id(level_id)
            if not level:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(level, key, value)

            level = await uow.difficulty_level_repository.update(level)
            response = DifficultyLevelResponse.model_validate(level)
            await uow.commit()
            return response

    async def delete_difficulty_level(self, level_id: int) -> bool:
        async with self.uow as uow:
            level = await uow.difficulty_level_repository.get_by_id(level_id)
            if not level:
                return False

            await uow.difficulty_level_repository.delete(level)
            await uow.commit()
            return True
