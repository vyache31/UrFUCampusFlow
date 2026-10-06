from types import TracebackType
from typing import Protocol, Self

from application.interfaces.repositories import SemestersRepositoryProtocol


class SemestersUoWProtocol(Protocol):
    semesters_repository: SemestersRepositoryProtocol

    async def __aenter__(self) -> Self:
        ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        ...

    async def commit(self) -> None:
        ...

    async def rollback(self) -> None:
        ...
