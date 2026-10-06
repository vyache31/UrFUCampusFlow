from typing import Protocol

from infrastructure.db.models import Students


class StudentRepositoryProtocol(Protocol):
    async def get_student_by_id(self, student_id: str) -> Students | None:
        ...
