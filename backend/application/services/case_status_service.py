from collections.abc import Sequence

from application.interfaces.uow.case_status_uow_protocol import CaseStatusUoWProtocol
from infrastructure.db.models import CaseStatuses
from presentation.api.schemas.case_status import CaseStatusCreate, CaseStatusUpdate


class CaseStatusService:

    def __init__(self, uow: CaseStatusUoWProtocol):
        self.uow = uow

    async def create_case_status(self, schema: CaseStatusCreate) -> CaseStatuses:
        status = CaseStatuses(
            code=schema.code,
            status_name=schema.status_name
        )

        async with self.uow as uow:
            status = await uow.case_status_repository.create(status)
            await uow.commit()
            return status

    async def get_case_status_by_id(self, status_id: int) -> CaseStatuses | None:
        async with self.uow as uow:
            return await uow.case_status_repository.get_by_id(status_id)

    async def get_all_case_statuses(self, limit: int = 10) -> Sequence[CaseStatuses]:
        async with self.uow as uow:
            return await uow.case_status_repository.get_all(limit=limit)

    async def update_case_status(self, status_id: int, schema: CaseStatusUpdate) -> CaseStatuses | None:
        async with self.uow as uow:
            status = await uow.case_status_repository.get_by_id(status_id)
            if not status:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(status, key, value)

            status = await uow.case_status_repository.update(status)
            await uow.commit()
            return status

    async def delete_case_status(self, status_id: int) -> bool:
        async with self.uow as uow:
            status = await uow.case_status_repository.get_by_id(status_id)
            if not status:
                return False

            await uow.case_status_repository.delete(status)
            await uow.commit()
            return True
