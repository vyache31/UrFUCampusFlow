from infrastructure.db.models import MeetingTask
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class MeetingTaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db


    async def create(self, task: MeetingTask) -> MeetingTask:
        self.db.add(task)
        await self.db.flush()
        return task


    async def update(self, task: MeetingTask) -> MeetingTask:
        await self.db.flush()
        return task


    async def get_by_id(self, task_id: str) -> MeetingTask | None:

        task = await self.db.execute(
            select(MeetingTask)
            .where(MeetingTask.id == task_id)
        )

        return task.scalar_one_or_none()


    async def get_by_meeting_id(self, meeting_id: str) -> list[MeetingTask]:

        tasks = await self.db.execute(
            select(MeetingTask)
            .where(MeetingTask.meeting_id == meeting_id)
        )

        return list(tasks.scalars().all())


    async def delete(self, task: MeetingTask) -> None:
        await self.db.delete(task)
