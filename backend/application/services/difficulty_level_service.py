from collections.abc import Sequence

from application.interfaces.uow.difficulty_level_uow_protocol import DifficultyLevelUoWProtocol
from infrastructure.db.models import DifficultyLevels
from presentation.api.schemas.difficulty_level import DifficultyLevelCreate, DifficultyLevelUpdate


class DifficultyLevelService:

    def __init__(self, uow: DifficultyLevelUoWProtocol):
        self.uow = uow

    async def create_difficulty_level(self, schema: DifficultyLevelCreate) -> DifficultyLevels:
        level = DifficultyLevels(
            code=schema.code,
            level_name=schema.level_name
        )

        async with self.uow as uow:
            level = await uow.difficulty_level_repository.create(level)
            await uow.commit()
            return level

    async def get_difficulty_level_by_id(self, level_id: int) -> DifficultyLevels | None:
        async with self.uow as uow:
            return await uow.difficulty_level_repository.get_by_id(level_id)

    async def get_all_difficulty_levels(self, limit: int = 10) -> Sequence[DifficultyLevels]:
        async with self.uow as uow:
            return await uow.difficulty_level_repository.get_all(limit=limit)

    async def update_difficulty_level(self, level_id: int, schema: DifficultyLevelUpdate) -> DifficultyLevels | None:
        async with self.uow as uow:
            level = await uow.difficulty_level_repository.get_by_id(level_id)
            if not level:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(level, key, value)

            level = await uow.difficulty_level_repository.update(level)
            await uow.commit()
            return level

    async def delete_difficulty_level(self, level_id: int) -> bool:
        async with self.uow as uow:
            level = await uow.difficulty_level_repository.get_by_id(level_id)
            if not level:
                return False

            await uow.difficulty_level_repository.delete(level)
            await uow.commit()
            return True
