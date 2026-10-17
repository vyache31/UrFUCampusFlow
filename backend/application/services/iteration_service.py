from collections.abc import Sequence

from application.interfaces.uow.iteration_uow_protocol import IterationUoWProtocol
from infrastructure.db.models import Iterations
from presentation.api.schemas.iteration import IterationCreate, IterationUpdate


class IterationService:

    def __init__(self, uow: IterationUoWProtocol):
        self.uow = uow

    async def create_iteration(self, schema: IterationCreate) -> Iterations:
        iteration = Iterations(
            code=schema.code,
            iteration_name=schema.iteration_name
        )

        async with self.uow as uow:
            iteration = await uow.iteration_repository.create(iteration)
            await uow.commit()
            return iteration

    async def get_iteration_by_id(self, iteration_id: int) -> Iterations | None:
        async with self.uow as uow:
            return await uow.iteration_repository.get_by_id(iteration_id)

    async def get_all_iterations(self, limit: int = 10) -> Sequence[Iterations]:
        async with self.uow as uow:
            return await uow.iteration_repository.get_all(limit=limit)

    async def update_iteration(self, iteration_id: int, schema: IterationUpdate) -> Iterations | None:
        async with self.uow as uow:
            iteration = await uow.iteration_repository.get_by_id(iteration_id)
            if not iteration:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(iteration, key, value)

            iteration = await uow.iteration_repository.update(iteration)
            await uow.commit()
            return iteration

    async def delete_iteration(self, iteration_id: int) -> bool:
        async with self.uow as uow:
            iteration = await uow.iteration_repository.get_by_id(iteration_id)
            if not iteration:
                return False

            await uow.iteration_repository.delete(iteration)
            await uow.commit()
            return True
