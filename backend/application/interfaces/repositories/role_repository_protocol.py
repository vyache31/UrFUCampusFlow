from collections.abc import Sequence
from typing import Protocol

from infrastructure.db.models import Roles


class RoleRepositoryProtocol(Protocol):
    async def get_all(self, limit: int = 10) -> Sequence[Roles]:
        ...

    async def get_by_id(self, role_id: int) -> Roles | None:
        ...

    async def create(self, role: Roles) -> Roles:
        ...

    async def update(self, role: Roles) -> Roles:
        ...

    async def delete(self, role: Roles) -> None:
        ...
