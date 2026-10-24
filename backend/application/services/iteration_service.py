from application.interfaces.uow.iteration_uow_protocol import IterationUoWProtocol
from infrastructure.db.models import Iterations
from presentation.api.schemas.iteration import (
    IterationCreate,
    IterationResponse,
    IterationUpdate,
)


class IterationService:

    def __init__(self, uow: IterationUoWProtocol):
        self.uow = uow

    async def create_iteration(self, schema: IterationCreate) -> IterationResponse:
        iteration = Iterations(
            code=schema.code,
            iteration_name=schema.iteration_name
        )

        async with self.uow as uow:
            iteration = await uow.iteration_repository.create(iteration)
            response = IterationResponse.model_validate(iteration)
            await uow.commit()
            return response

    async def get_iteration_by_id(self, iteration_id: int) -> IterationResponse | None:
        async with self.uow as uow:
            iteration = await uow.iteration_repository.get_by_id(iteration_id)
            return IterationResponse.model_validate(iteration) if iteration else None

    async def get_all_iterations(self, limit: int = 10) -> list[IterationResponse]:
        async with self.uow as uow:
            iterations = await uow.iteration_repository.get_all(limit=limit)
            return [IterationResponse.model_validate(item) for item in iterations]

    async def update_iteration(self, iteration_id: int, schema: IterationUpdate) -> IterationResponse | None:
        async with self.uow as uow:
            iteration = await uow.iteration_repository.get_by_id(iteration_id)
            if not iteration:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(iteration, key, value)

            iteration = await uow.iteration_repository.update(iteration)
            response = IterationResponse.model_validate(iteration)
            await uow.commit()
            return response

    async def delete_iteration(self, iteration_id: int) -> bool:
        async with self.uow as uow:
            iteration = await uow.iteration_repository.get_by_id(iteration_id)
            if not iteration:
                return False

            await uow.iteration_repository.delete(iteration)
            await uow.commit()
            return True
