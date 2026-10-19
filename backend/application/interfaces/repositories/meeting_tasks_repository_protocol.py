from typing import Protocol

from infrastructure.db.models import MeetingTask


class MeetingTaskRepositoryProtocol(Protocol):
    async def create(self, task: MeetingTask) -> MeetingTask:
        ...

    async def update(self, task: MeetingTask) -> MeetingTask:
        ...

    async def get_by_id(self, task_id: str) -> MeetingTask | None:
        ...

    async def get_by_meeting_id(self, meeting_id: str) -> list[MeetingTask]:
        ...

    async def delete(self, task: MeetingTask) -> None:
        ...
