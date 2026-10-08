from typing import Protocol

from application.interfaces.repositories import (
    MeetingTaskRepositoryProtocol,
    MeetingsRepositoryProtocol,
)
from application.interfaces.uow.uow_protocol import UoWProtocol


class MeetingTasksUoWProtocol(UoWProtocol, Protocol):
    meeting_tasks_repository: MeetingTaskRepositoryProtocol
    meetings_repository: MeetingsRepositoryProtocol
