from models import CaseStatuses
from schemas.case_status import CaseStatusCreate, CaseStatusUpdate
from repositories.case_status_repository import CaseStatusRepository


class CaseStatusService:

    def __init__(self, rep: CaseStatusRepository):
        self.rep = rep

    async def create_case_status(self, schema: CaseStatusCreate) -> CaseStatuses:
        status = CaseStatuses(
            status_code=schema.status_code,
            status_name=schema.status_name
        )

        return await self.rep.create(status)

    async def get_case_status_by_id(self, status_id: int) -> CaseStatuses | None:
        return await self.rep.get_by_id(status_id)

    async def get_all_case_statuses(self, limit: int = 10) -> list[CaseStatuses]:
        return await self.rep.get_all(limit=limit)

    async def update_case_status(self, status_id: int, schema: CaseStatusUpdate) -> CaseStatuses | None:
        status = await self.rep.get_by_id(status_id)
        if not status:
            return None

        update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

        for key, value in update_data.items():
            setattr(status, key, value)

        return await self.rep.update(status)

    async def delete_case_status(self, status_id: int) -> bool:
        status = await self.rep.get_by_id(status_id)
        if not status:
            return None

        await self.rep.delete(status)
        return True
