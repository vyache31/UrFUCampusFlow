from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models import Students


class StudentRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[Students]:
        ...

    async def get_student_by_id(self, student_id: str) -> Students | None:
        ...

    async def verify_university(self, university_id: int) -> bool:
        ...

    async def create_student(self, student: Students) -> Students:
        ...

    async def update(self) -> None:
        ...

    async def delete(self, student: Students) -> None:
        ...
