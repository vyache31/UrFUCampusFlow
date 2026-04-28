from models import Iterations
from schemas.iteration import IterationCreate, IterationUpdate
from repositories.iteration_repository import IterationRepository


class IterationService:

    def __init__(self, rep: IterationRepository):
        self.rep = rep

    async def create_iteration(self, schema: IterationCreate) -> Iterations:
        iteration = Iterations(
            iteration_name=schema.iteration_name
        )

        return await self.rep.create(iteration)

    async def get_iteration_by_id(self, iteration_id: int) -> Iterations | None:
        return await self.rep.get_by_id(iteration_id)

    async def get_all_iterations(self, limit: int = 10) -> list[Iterations]:
        return await self.rep.get_all(limit=limit)

    async def update_iteration(self, iteration_id: int, schema: IterationUpdate) -> Iterations | None:
        iteration = await self.rep.get_by_id(iteration_id)
        if not iteration:
            return None

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        for key, value in update_data.items():
            setattr(iteration, key, value)

        return await self.rep.update(iteration)

    async def delete_iteration(self, iteration_id: int) -> bool:
        iteration = await self.rep.get_by_id(iteration_id)
        if not iteration:
            return None

        await self.rep.delete(iteration)
        return True
