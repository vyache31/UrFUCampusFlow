from collections.abc import Sequence

from application.interfaces.uow.role_uow_protocol import RoleUoWProtocol
from infrastructure.db.models import Roles
from presentation.api.schemas.role import RoleCreate, RoleUpdate


class RoleService:

    def __init__(self, uow: RoleUoWProtocol):
        self.uow = uow

    async def create_role(self, schema: RoleCreate) -> Roles:
        role = Roles(
            code=schema.code,
            role_name=schema.role_name
        )

        async with self.uow as uow:
            role = await uow.role_repository.create(role)
            await uow.commit()
            return role

    async def get_role_by_id(self, role_id: int) -> Roles | None:
        async with self.uow as uow:
            return await uow.role_repository.get_by_id(role_id)

    async def get_all_roles(self, limit: int = 10) -> Sequence[Roles]:
        async with self.uow as uow:
            return await uow.role_repository.get_all(limit=limit)

    async def update_role(self, role_id: int, schema: RoleUpdate) -> Roles | None:
        async with self.uow as uow:
            role = await uow.role_repository.get_by_id(role_id)
            if not role:
                return None

            update_data = schema.model_dump(exclude_none=True, exclude_unset=True)

            for key, value in update_data.items():
                setattr(role, key, value)

            role = await uow.role_repository.update(role)
            await uow.commit()
            return role

    async def delete_role(self, role_id: int) -> bool:
        async with self.uow as uow:
            role = await uow.role_repository.get_by_id(role_id)
            if not role:
                return False

            await uow.role_repository.delete(role)
            await uow.commit()
            return True
