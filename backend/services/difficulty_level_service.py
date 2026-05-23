from models import DifficultyLevels
from schemas.difficulty_level import DifficultyLevelCreate, DifficultyLevelUpdate
from repositories.difficulty_level_repository import DifficultyLevelRepository


class DifficultyLevelService:

    def __init__(self, rep: DifficultyLevelRepository):
        self.rep = rep

    async def create_difficulty_level(self, schema: DifficultyLevelCreate) -> DifficultyLevels:
        level = DifficultyLevels(
            code=schema.code,
            level_name=schema.level_name
        )

        return await self.rep.create(level)

    async def get_difficulty_level_by_id(self, level_id: int) -> DifficultyLevels | None:
        return await self.rep.get_by_id(level_id)

    async def get_all_difficulty_levels(self, limit: int = 10) -> list[DifficultyLevels]:
        return await self.rep.get_all(limit=limit)

    async def update_difficulty_level(self, level_id: int, schema: DifficultyLevelUpdate) -> DifficultyLevels | None:
        level = await self.rep.get_by_id(level_id)
        if not level:
            return None

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        for key, value in update_data.items():
            setattr(level, key, value)

        return await self.rep.update(level)

    async def delete_difficulty_level(self, level_id: int) -> bool:
        level = await self.rep.get_by_id(level_id)
        if not level:
            return None

        await self.rep.delete(level)
        return True
